import { useUploadStore } from '../store/uploadStore';
import { generateVideo, initGoogleAuth, requestAuthToken, uploadToYouTube } from '../utils/YouTubeUploader';
import { supabase } from '../api/client';

export const useYouTubeSync = () => {
    const {
        setYoutubeStatus,
        setYoutubeProgress,
        setYoutubeVideoId,
    } = useUploadStore();

    /**
     * Executes the full Dual Upload pipeline.
     * @param {string} productId - The ID of the product in the OFFSZN database.
     * @param {string} preAuthorizedToken - Optional token obtained early in the gesture.
     */
    const handleSync = async (productId, preAuthorizedToken = null) => {
        // Get fresh state from store
        const { title, description, tags, coverImage, files } = useUploadStore.getState();

        if (!coverImage?.preview) {
            throw new Error('No se encontró una portada válida para generar el video.');
        }
        try {
            console.log('🚀 Initiating YouTube Sync Pipeline for product:', productId);

            let token = preAuthorizedToken;

            // 1. Initial Google Setup
            await initGoogleAuth();

            // If no token provided (maybe manually triggered later), request it now
            if (!token) {
                setYoutubeStatus('uploading'); // Temporarily show uploading state for the popup
                token = await requestAuthToken();
            }

            // 2. Render Video (Client Side - FFmpeg)
            setYoutubeStatus('rendering');
            setYoutubeProgress(5);

            // Handle both File objects and DataURLs from the cropper
            const coverBlob = coverImage.preview;
            const audioBlob = files.mp3_tagged;

            if (!audioBlob) throw new Error('No audio file found for YouTube render.');

            const videoBlob = await generateVideo(
                coverBlob,
                audioBlob,
                (progress) => setYoutubeProgress(10 + Math.round(progress * 0.6)) // 10% to 70%
            );

            console.log('✅ Video Rendered successfully');

            setYoutubeStatus('uploading');
            setYoutubeProgress(75);
            // token is already obtained at the start

            // 4. Upload to YouTube API
            const youtubeMetadata = {
                title: `${title} (Official Visualizer)`,
                description: `${description}\n\n🎧 Listen/Download: ${window.location.origin}/product/${productId}\n\n#OFFSZN #Beats #MusicProduction`,
                tags: [...tags, 'OFFSZN', 'Producer'],
                privacy: 'public'
            };

            const ytResponse = await uploadToYouTube(videoBlob, youtubeMetadata, token);
            const videoId = ytResponse.id;

            console.log('✅ YouTube Upload Success! ID:', videoId);

            // 5. Finalize State & Database
            setYoutubeVideoId(videoId);

            const { error: dbError } = await supabase
                .from('products')
                .update({
                    youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
                    youtube_id: videoId
                })
                .eq('id', productId);

            if (dbError) console.error('Error updating DB with YouTube info:', dbError);

            setYoutubeStatus('success');
            setYoutubeProgress(100);

            return { success: true, videoId };

        } catch (error) {
            console.error('❌ YouTube Sync Error:', error);
            setYoutubeStatus('error');
            throw error;
        }
    };

    return { handleSync };
};
