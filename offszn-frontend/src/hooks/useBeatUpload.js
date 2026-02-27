import { useState } from 'react';
import apiClient, { supabase } from '../api/client';
import { useAuth } from '../store/authStore';

export const useBeatUpload = () => {
  const { user, profile } = useAuth();
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ message: '', progress: 0 });

  // --- HELPER: Sanitize Filename ---
  const sanitize = (name) => {
    if (!name) return 'file';
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')
      .substring(0, 100);
  };

  // --- HELPER: DataURL to Blob ---
  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // --- MAIN FUNCTION ---
  const handleSaveProduct = async (fileObjects, formState, isDraft = false) => {
    if (isPublishing) return;
    setIsPublishing(true);
    setUploadProgress({ message: 'Iniciando proceso...', progress: 5 });

    try {
      if (!user) throw new Error("Debes iniciar sesión para subir contenido.");

      // 1. Database Object Construction
      const productData = {
        name: formState.title,
        description: formState.description || '',
        bpm: parseInt(formState.bpm) || null,
        key: formState.musicalKey || null,
        product_type: formState.productType || 'beat',
        tags: formState.tags || [],

        // Pricing
        price_basic: parseFloat(formState.basePrice) || 0,
        price_premium: parseFloat(formState.promoPrice) || 0,
        is_free: formState.isFree || false,

        // Metadata & Status
        visibility: formState.visibility || 'public',
        status: isDraft ? 'draft' : 'approved',
        release_date: formState.date || new Date().toISOString(),

        // Producer / Owner
        producer_id: user.id,
        producer_nickname: profile?.nickname || 'Productor',

        // JSONB structure for collaborators
        collaborators: formState.collaborators || [],

        created_at: new Date().toISOString(),
      };

      // 2. File Uploads (Supabase Storage)

      // A) Cover Image (Handle both File and Cropped DataURL)
      if (formState.coverImage?.preview) {
        setUploadProgress({ message: 'Subiendo portada...', progress: 20 });
        const isDataUrl = formState.coverImage.preview.startsWith('data:');
        const blob = isDataUrl ? dataURLtoBlob(formState.coverImage.preview) : formState.coverImage.file;
        const ext = isDataUrl ? 'jpg' : (formState.coverImage.file?.name.split('.').pop() || 'jpg');
        const path = `${user.id}/covers/${Date.now()}_cover.${ext}`;

        const { error } = await supabase.storage.from('products').upload(path, blob, { contentType: isDataUrl ? 'image/jpeg' : undefined });
        if (error) throw error;

        const { data: publicUrl } = supabase.storage.from('products').getPublicUrl(path);
        productData.image_url = publicUrl.publicUrl;
        console.log("DEBUG: Final Product Image URL ->", productData.image_url);
      }

      // B) Primary Audio (Tagged MP3)
      if (fileObjects.mp3File) {
        setUploadProgress({ message: 'Subiendo preescucha...', progress: 40 });
        const name = sanitize(fileObjects.mp3File.name);
        const path = `${user.id}/mp3_tagged/${Date.now()}_${name}`;

        const { error } = await supabase.storage.from('products').upload(path, fileObjects.mp3File);
        if (error) throw error;

        const { data: publicUrl } = supabase.storage.from('products').getPublicUrl(path);
        productData.mp3_url = publicUrl.publicUrl;
        productData.audio_url = publicUrl.publicUrl; // Used by players
      }

      // C) Main Product File (WAV / ZIP / Preset) - Secure Storage
      if (fileObjects.wavFile || fileObjects.zipFile) {
        setUploadProgress({ message: 'Subiendo archivo principal...', progress: 70 });
        const mainFile = fileObjects.wavFile || fileObjects.zipFile;
        const folder = fileObjects.wavFile ? 'wav_untagged' : (productData.product_type === 'preset' ? 'presets' : 'kits');
        const name = sanitize(mainFile.name);
        const path = `${user.id}/${folder}/${Date.now()}_${name}`;

        const { data, error } = await supabase.storage.from('secure-products').upload(path, mainFile);
        if (error) throw error;

        // For secure products, we only store the internal path
        if (fileObjects.wavFile) productData.wav_url = data.path;
        if (fileObjects.zipFile) {
          // Kits and Presets store their main download in a dedicated field or reuse stems/wav if needed by existing cards
          productData.stems_url = data.path; // Keep stems_url for compatibility with download logic if it expects it
          productData.audio_url = null; // Kits don't have a preview player url unless we add an mp3_tagged for them
        }
      }

      // D) Optional Stems (for beats)
      if (fileObjects.stemsFile) {
        setUploadProgress({ message: 'Subiendo stems...', progress: 85 });
        const name = sanitize(fileObjects.stemsFile.name);
        const path = `${user.id}/stems/${Date.now()}_${name}`;

        const { data, error } = await supabase.storage.from('secure-products').upload(path, fileObjects.stemsFile);
        if (error) throw error;

        productData.stems_url = data.path;
      }

      // 3. Database Insertion
      setUploadProgress({ message: 'Finalizando...', progress: 95 });

      const { data: insertedData, error: dbError } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (dbError) throw dbError;

      // Notify the owner about successful upload (non-blocking)
      try {
        await apiClient.post('/notifications', {
          targetUserId: user.id,
          type: 'product_upload',
          message: `Tu producto '<strong>${formState.title}</strong>' se ha subido exitosamente.`,
          link: `/dashboard/my-products`
        });
      } catch (notifErr) {
        console.warn("Could not dispatch product_upload notification:", notifErr);
      }

      // Notify each collaborator that they were added to this product.
      // collaborators already have { id, nickname, split } from the Step3 user search — no email lookup needed.
      const collaboratorsList = formState.collaborators || [];
      console.log('[DEBUG useBeatUpload] formState.collaborators:', JSON.stringify(collaboratorsList));
      if (collaboratorsList.length > 0) {
        for (const collab of collaboratorsList) {
          if (!collab.id || collab.id === user.id) continue;
          try {
            await apiClient.post('/notifications', {
              targetUserId: collab.id,
              type: 'collab_invite',
              message: `Has sido añadido como colaborador en '<strong>${formState.title}</strong>'.`,
              link: `/dashboard/collaborations`
            });
            console.log(`[Upload] collab_invite notification sent to ${collab.nickname} (${collab.id})`);
          } catch (notifErr) {
            console.warn(`Could not notify collaborator ${collab.nickname}:`, notifErr);
          }
        }
      }

      setUploadProgress({ message: 'Publicado con éxito!', progress: 100 });
      return { success: true, data: insertedData };

    } catch (error) {
      console.error("Upload Error:", error);
      return { success: false, error: error.message };
    } finally {
      setIsPublishing(false);
    }
  };

  return { handleSaveProduct, isPublishing, uploadProgress };
};