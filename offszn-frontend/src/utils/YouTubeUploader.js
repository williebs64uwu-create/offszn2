import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';

let ffmpeg = null;
let tokenClient = null;

/**
 * Loads FFmpeg libraries with support for SharedArrayBuffer.
 */
export const loadFFmpeg = async (onProgress) => {
    if (ffmpeg && ffmpeg.loaded) return ffmpeg;

    ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
        console.log('[YouTubeUploader FFmpeg]', message);
    });

    ffmpeg.on('progress', ({ progress }) => {
        if (onProgress) onProgress(Math.round(progress * 100));
    });

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    return ffmpeg;
};

/**
 * Renders a simple visualizer video (Still image + Audio).
 */
export const generateVideo = async (coverBlob, audioBlob, onProgress) => {
    const ff = await loadFFmpeg(onProgress);

    const audioExt = audioBlob.type.includes('wav') ? 'wav' : 'mp3';

    await ff.writeFile('input.jpg', await fetchFile(coverBlob));
    await ff.writeFile(`audio.${audioExt}`, await fetchFile(audioBlob));

    // Run conversion command (optimized for speed)
    await ff.exec([
        '-loop', '1',
        '-framerate', '1',
        '-i', 'input.jpg',
        '-i', `audio.${audioExt}`,
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        'out.mp4'
    ]);

    const data = await ff.readFile('out.mp4');
    return new Blob([data.buffer], { type: 'video/mp4' });
};

/**
 * Initializes Google Identity Services for OAuth2.
 */
let isGisIniting = false;
export const initGoogleAuth = () => {
    return new Promise((resolve, reject) => {
        // If already initialized, just resolve
        if (tokenClient) {
            console.log('✅ Google Auth already initialized.');
            resolve();
            return;
        }

        if (window.google?.accounts?.oauth2) {
            console.log('🛠️ Initializing Google Token Client...');
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: () => { },
            });
            resolve();
            return;
        }

        if (isGisIniting) {
            console.log('⏳ GIS already initing, waiting...');
            const check = setInterval(() => {
                if (window.google?.accounts?.oauth2) {
                    clearInterval(check);
                    resolve(initGoogleAuth());
                }
            }, 100);
            return;
        }

        console.log('🌐 Loading Google GSI Script...');
        isGisIniting = true;
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = () => {
            console.log('✅ Google GSI Script Loaded.');
            isGisIniting = false;
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: () => { },
            });
            resolve();
        };
        script.onerror = () => {
            console.log('❌ Failed to load Google GSI Script.');
            isGisIniting = false;
            reject(new Error('Failed to load Google Identity Services'));
        };
        document.body.appendChild(script);
    });
};

/**
 * Requests an access token from the user.
 */
/**
 * Requests an access token from the user.
 */
export const requestAuthToken = () => {
    return new Promise((resolve, reject) => {
        if (!window.google?.accounts?.oauth2) {
            console.log('❌ Google OAuth no está cargado');
            reject(new Error('El sistema de Google no está listo aún. Espera unos segundos.'));
            return;
        }

        const timeout = setTimeout(() => {
            console.log('⚠️ Token Request Timeout after 60s');
            reject(new Error('La autorización de Google tardó demasiado o la ventana se cerró. Reintenta por favor.'));
        }, 60000);

        console.log('🔑 Requesting Access Token from user...');

        // RE-INICIALIZAMOS el cliente EXACTAMENTE aquí, con el resolve y reject conectados
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (resp) => {
                clearTimeout(timeout); // Cancelamos la bomba de tiempo
                console.log('🎫 Token Callback Received:', resp);

                if (resp.error) {
                    console.log('❌ Auth Error:', resp.error);
                    reject(new Error(resp.error));
                } else {
                    console.log('✅ Token Obtained Successfully.');
                    resolve(resp.access_token);
                }
            }
        });

        // Disparamos el popup inmediatamente
        client.requestAccessToken({ prompt: 'consent' });
    });
};

/**
 * Uploads a video blob to YouTube via Data API v3.
 */
export const uploadToYouTube = async (videoBlob, metadata, token) => {
    const snippet = {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: '10', // Music
    };

    const status = {
        privacyStatus: metadata.privacy || 'public',
    };

    // 1. Initiate Resumable Upload
    const initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ snippet, status }),
    });

    if (!initResponse.ok) {
        const error = await initResponse.json();
        throw new Error(error.error?.message || 'Failed to initiate YouTube upload');
    }

    const uploadUrl = initResponse.headers.get('Location');

    // 2. Upload Video Bytes
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'video/mp4',
        },
        body: videoBlob,
    });

    if (!uploadResponse.ok) {
        throw new Error('Failed to upload video bytes to YouTube');
    }

    return await uploadResponse.json();
};
