import React, { useState, useRef, useCallback } from 'react';
import { useChatStore, getAvatarUrl } from '../../store/useChatStore';
import { useAuth } from '../../store/authStore';
import { supabase, apiClient } from '../../api/client';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/cropImage';

export default function GroupCreationModal() {
    const {
        isGroupModalOpen, setIsGroupModalOpen,
        fetchConversations, openConversation
    } = useChatStore();
    const { user } = useAuth();

    const [step, setStep] = useState(1); // 1 = Integrantes, 2 = Info de Grupo
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Info Grupo
    const [groupName, setGroupName] = useState('');
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const debounceRef = useRef(null);

    if (!isGroupModalOpen) return null;

    const resetAndClose = () => {
        setIsGroupModalOpen(false);
        setStep(1);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUsers([]);
        setGroupName('');
        setImageSrc(null);
    };

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            if (!val.trim()) { setSearchResults([]); return; }
            setIsSearching(true);
            try {
                const { data } = await supabase.from('users').select('id, nickname, avatar_url, role').ilike('nickname', `%${val}%`).neq('id', user.id).limit(10);
                setSearchResults(data || []);
            } catch (err) { console.error(err); } finally { setIsSearching(false); }
        }, 400);
    };

    const toggleUser = (u) => {
        if (selectedUsers.find(su => su.id === u.id)) {
            setSelectedUsers(prev => prev.filter(su => su.id !== u.id));
        } else {
            setSelectedUsers(prev => [...prev, u]);
        }
    };

    const onFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            let imageDataUrl = await new Promise((resolve) => {
                let reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
            });
            setImageSrc(imageDataUrl);
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createGroup = async () => {
        if (!groupName.trim()) return toast.error("El nombre del grupo es requerido");
        setIsSaving(true);
        try {
            let avatarUrl = '';
            if (imageSrc && croppedAreaPixels) {
                const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
                const fileExt = 'jpeg';
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, croppedBlob);
                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
                avatarUrl = publicUrlData.publicUrl;
            }

            // Crear conversation vía API
            const res = await apiClient.post('/chat/groups', {
                name: groupName.trim(),
                avatarUrl: avatarUrl || null,
                participantIds: selectedUsers.map(u => u.id)
            });

            const conv = res.data;

            toast.success("Grupo creado");
            await fetchConversations(user.id);
            openConversation({
                id: conv.id,
                name: conv.group_name,
                avatar: conv.group_avatar_url,
                isGroup: true
            });
            resetAndClose();

        } catch (err) {
            console.error(err);
            toast.error("Error al crear grupo");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="chat-modal-overlay flex items-center justify-center fixed inset-0 z-[100] bg-black/80" onClick={resetAndClose}>
            <div className="chat-modal-container bg-[#111] border border-[#222] rounded-2xl w-[90%] max-w-[400px] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="chat-modal-header flex items-center justify-between border-b border-[#222] p-4 bg-[#151515]">
                    {step === 1 ? (
                        <button className="text-[#a855f7] hover:text-[#9333ea] transition text-sm font-semibold p-1" onClick={resetAndClose}>Cancelar</button>
                    ) : (
                        <button className="text-[#a855f7] hover:text-[#9333ea] transition flex items-center p-1" onClick={() => setStep(1)}><i className="bi bi-chevron-left"></i> Atrás</button>
                    )}

                    <div className="chat-modal-title text-white font-semibold text-base">{step === 1 ? 'Añadir integrantes' : 'Nuevo Grupo'}</div>

                    {step === 1 ? (
                        <button
                            className={`text-sm font-semibold p-1 transition ${selectedUsers.length > 0 ? 'text-[#a855f7] hover:text-[#9333ea]' : 'text-gray-600 cursor-not-allowed'}`}
                            onClick={() => selectedUsers.length > 0 && setStep(2)}
                        >
                            Siguiente
                        </button>
                    ) : (
                        <div className="w-10"></div> /* Spacer */
                    )}
                </div>

                {step === 1 && (
                    <>
                        <div className="p-4 border-b border-[#222] bg-[#111]">
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedUsers.map(u => (
                                    <div key={u.id} className="bg-[#8b5cf6]/20 text-[#a855f7] px-3 py-1 rounded-full text-xs flex items-center gap-1 font-semibold">
                                        {u.nickname}
                                        <i className="bi bi-x cursor-pointer hover:text-white" onClick={() => toggleUser(u)}></i>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400 text-sm font-medium">Para:</span>
                                <input
                                    type="text"
                                    className="bg-transparent border-none text-white outline-none flex-1 text-sm placeholder-gray-600 focus:ring-0"
                                    placeholder="Buscar personas..."
                                    value={searchQuery}
                                    onChange={e => handleSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[350px] min-h-[300px]">
                            {isSearching ? (
                                <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div></div>
                            ) : searchResults.map(u => {
                                const isSelected = selectedUsers.some(su => su.id === u.id);
                                return (
                                    <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] cursor-pointer transition-colors" onClick={() => toggleUser(u)}>
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#333] flex-shrink-0">
                                            <img src={getAvatarUrl(u.avatar_url, u.nickname)} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col flex-1 overflow-hidden">
                                            <span className="text-white text-sm font-semibold truncate">{u.nickname}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#8b5cf6] border-[#8b5cf6]' : 'border-gray-600'}`}>
                                            {isSelected && <i className="bi bi-check text-white text-sm"></i>}
                                        </div>
                                    </div>
                                )
                            })}
                            {!isSearching && searchResults.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">Busca un usuario</div>}
                        </div>
                    </>
                )}

                {step === 2 && (
                    <div className="flex flex-col flex-1 p-6 items-center overflow-y-auto max-h-[450px]">

                        {/* Avatar Picker / Cropper */}
                        {!imageSrc ? (
                            <div className="relative group cursor-pointer mb-6">
                                <input type="file" accept="image/*" onChange={onFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <div className="w-24 h-24 rounded-full bg-[#222] border-2 border-dashed border-[#444] group-hover:border-[#8b5cf6] flex items-center justify-center transition-colors">
                                    <i className="bi bi-camera-fill text-3xl text-gray-500 group-hover:text-[#8b5cf6] transition-colors"></i>
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full h-[200px] bg-[#0a0a0a] rounded-xl overflow-hidden mb-6">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                                <button className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center z-50 hover:bg-black" onClick={() => setImageSrc(null)}>
                                    <i className="bi bi-x"></i>
                                </button>
                            </div>
                        )}

                        <div className="w-full mb-6">
                            <label className="text-xs text-gray-400 font-semibold uppercase mb-2 block">Nombre del grupo</label>
                            <input
                                type="text"
                                className="w-full bg-[#1a1a1a] border border-[#333] text-white p-3 rounded-lg outline-none focus:border-[#8b5cf6] transition-colors"
                                placeholder="Ej. Beats Collab"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                            />
                        </div>

                        <button
                            className="w-full bg-[#8b5cf6] text-white font-bold py-3 rounded-lg hover:bg-[#7c3aed] transition-colors flex justify-center disabled:opacity-50"
                            onClick={createGroup}
                            disabled={isSaving}
                        >
                            {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Crear Grupo'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
