import { useState, useEffect, useCallback } from 'react';

const YT_CONFIG = {
    CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    SCOPES: 'https://www.googleapis.com/auth/youtube.readonly',
    DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest']
};

export const useYouTubeScanner = () => {
    const [gapiReady, setGapiReady] = useState(false);
    const [gisReady, setGisReady] = useState(false);
    const [tokenClient, setTokenClient] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState('');
    const [error, setError] = useState(null);

    // 1. Load GAPI & GIS scripts
    useEffect(() => {
        const loadScripts = () => {
            const gapiScript = document.createElement('script');
            gapiScript.src = 'https://apis.google.com/js/api.js';
            gapiScript.async = true;
            gapiScript.defer = true;
            gapiScript.onload = () => {
                window.gapi.load('client', async () => {
                    await window.gapi.client.init({
                        discoveryDocs: YT_CONFIG.DISCOVERY_DOCS,
                    });
                    setGapiReady(true);
                });
            };
            document.body.appendChild(gapiScript);

            const gisScript = document.createElement('script');
            gisScript.src = 'https://accounts.google.com/gsi/client';
            gisScript.async = true;
            gisScript.defer = true;
            gisScript.onload = () => {
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: YT_CONFIG.CLIENT_ID,
                    scope: YT_CONFIG.SCOPES,
                    callback: '', // defined at request time
                });
                setTokenClient(client);
                setGisReady(true);
            };
            document.body.appendChild(gisScript);
        };

        if (!window.gapi || !window.google) {
            loadScripts();
        } else {
            setGapiReady(true);
            setGisReady(true);
        }
    }, []);

    // 2. Fetch User Videos
    const fetchVideos = useCallback(async (pageToken = '') => {
        if (!gapiReady) return;
        setLoading(true);
        setError(null);

        try {
            const response = await window.gapi.client.youtube.search.list({
                "part": ["snippet"],
                "forMine": true,
                "maxResults": 50,
                "type": ["video"],
                "pageToken": pageToken
            });

            const newVideos = response.result.items;
            setNextPageToken(response.result.nextPageToken || '');

            setVideos(prev => pageToken ? [...prev, ...newVideos] : newVideos);
        } catch (err) {
            console.error("YouTube SDK Error:", err);
            setError("Error al conectar con YouTube. Verifica los permisos.");
        } finally {
            setLoading(false);
        }
    }, [gapiReady]);

    // 3. Handle Login/Auth
    const loginAndFetch = useCallback(() => {
        if (!tokenClient) return;

        const token = window.gapi.client.getToken();
        if (token === null) {
            tokenClient.callback = async (resp) => {
                if (resp.error !== undefined) {
                    setError("Error de autenticación con Google.");
                    return;
                }
                await fetchVideos();
            };
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            fetchVideos();
        }
    }, [tokenClient, fetchVideos]);

    // 4. Get Video Details (for tags)
    const getVideoDetails = useCallback(async (videoId) => {
        if (!gapiReady) return null;
        try {
            const response = await window.gapi.client.youtube.videos.list({
                "part": ["snippet"],
                "id": [videoId]
            });
            return response.result.items[0];
        } catch (err) {
            console.error("YouTube Details Error:", err);
            return null;
        }
    }, [gapiReady]);

    return {
        ready: gapiReady && gisReady,
        videos,
        loading,
        error,
        nextPageToken,
        fetchVideos,
        loginAndFetch,
        getVideoDetails
    };
};
