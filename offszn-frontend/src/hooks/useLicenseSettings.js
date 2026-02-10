import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../api/client';
import { useAuth } from '../store/authStore';
import toast from 'react-hot-toast';

export const LICENSE_TIERS = ['basic', 'premium', 'trackout', 'unlimited'];

export const LICENSE_DEFAULTS = {
    basic: {
        name: 'Basic Lease',
        price: 19.99,
        enabled: true,
        files: { wav: false, stems: false },
        usage: { streams: '5000', sales: '500', radio: 'No Permitido' }
    },
    premium: {
        name: 'Premium Lease',
        price: 49.99,
        enabled: true,
        files: { wav: true, stems: false },
        usage: { streams: '50000', sales: '2000', radio: '2 Estaciones' }
    },
    trackout: {
        name: 'Trackout Lease',
        price: 99.99,
        enabled: true,
        files: { wav: true, stems: true },
        usage: { streams: '500000', sales: '10000', radio: 'ILIMITADO' }
    },
    unlimited: {
        name: 'Unlimited License',
        price: 299.99,
        enabled: true,
        files: { wav: true, stems: true },
        usage: { streams: 'UNLIMITED', sales: 'UNLIMITED', radio: 'ILIMITADO' }
    }
};

export const useLicenseSettings = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('users')
                .select('license_settings')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            // Merge with defaults to ensure all fields exist
            const savedSettings = data?.license_settings || {};
            const finalSettings = {};

            LICENSE_TIERS.forEach(tier => {
                finalSettings[tier] = {
                    ...LICENSE_DEFAULTS[tier],
                    ...(savedSettings[tier] || {})
                };
            });

            setSettings(finalSettings);
        } catch (err) {
            console.error("Error loading license settings:", err);
            // Fallback to defaults on error
            setSettings(JSON.parse(JSON.stringify(LICENSE_DEFAULTS)));
            // toast.error("Error al cargar configuración de licencias");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const updateTier = (tier, data) => {
        setSettings(prev => ({
            ...prev,
            [tier]: { ...prev[tier], ...data }
        }));
    };

    const resetTier = (tier) => {
        setSettings(prev => ({
            ...prev,
            [tier]: JSON.parse(JSON.stringify(LICENSE_DEFAULTS[tier]))
        }));
    };

    const saveSettings = async () => {
        if (!user || !settings) return;

        // Validation: Duplicate names
        const names = Object.values(settings).map(l => l.name.trim().toLowerCase());
        const uniqueNames = new Set(names);
        if (names.length !== uniqueNames.size) {
            toast.error("No puedes tener dos licencias con el mismo nombre.");
            return false;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ license_settings: settings })
                .eq('id', user.id);

            if (error) throw error;
            toast.success("Configuración de licencias guardada");
            return true;
        } catch (err) {
            console.error("Error saving licenses:", err);
            toast.error("Error al guardar cambios");
            return false;
        } finally {
            setSaving(false);
        }
    };

    return {
        settings,
        loading,
        saving,
        updateTier,
        resetTier,
        saveSettings,
        refresh: fetchSettings
    };
};
