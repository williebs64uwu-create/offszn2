import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialFormState = {
    currentStep: 1,
    productType: 'beat', // 'beat', 'drumkit', 'loopkit', 'preset'

    // Step 1: Details
    title: '',
    description: '',
    coverImage: null, // { file: null, preview: null, url: null }
    date: new Date().toISOString().split('T')[0],
    visibility: 'private',

    // Step 2: Files
    files: {
        mp3_tagged: null,
        wav_untagged: null,
        stems: null,
        // For other types
        zip_file: null,
        preset_file: null,
    },

    // Step 2: Metadata
    tags: [],
    bpm: '',
    musicalKey: '',
    category: '', // For presets

    // Step 3: Pricing
    basePrice: '',
    promoPrice: '',
    isFree: false,
    collaborators: [], // { id: string, nickname: string, email: string, split: number }

    // Step 4: Logic
    isValid: false,
    isPublishing: false,
    publishProgress: 0,
};

export const useUploadStore = create(
    persist(
        (set, get) => ({
            ...initialFormState,

            setStep: (step) => set({ currentStep: step }),
            nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 4) })),
            prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

            selectType: (type) => set({
                productType: type,
                currentStep: 1,
                // Limpiar campos específicos si se cambia de tipo
                bpm: '',
                musicalKey: '',
                tags: []
            }),

            updateField: (field, value) => set({ [field]: value }),

            updateFiles: (newFiles) => set((state) => ({
                files: { ...state.files, ...newFiles }
            })),

            addTag: (tag) => set((state) => {
                if (state.tags.length >= 8) return state; // Limit according to documentation
                if (state.tags.includes(tag.toLowerCase())) return state;
                return { tags: [...state.tags, tag.toLowerCase()] };
            }),

            removeTag: (tag) => set((state) => ({
                tags: state.tags.filter(t => t !== tag)
            })),

            setCollaborators: (collabs) => set({ collaborators: collabs }),

            addCollaborator: (collab) => set((state) => {
                if (state.collaborators.find(c => c.id === collab.id)) return state;
                return { collaborators: [...state.collaborators, collab] };
            }),

            removeCollaborator: (id) => set((state) => ({
                collaborators: state.collaborators.filter(c => c.id !== id)
            })),

            updateCollaboratorSplit: (id, split) => set((state) => ({
                collaborators: state.collaborators.map(c => c.id === id ? { ...c, split } : c)
            })),

            resetForm: () => set(initialFormState),
        }),
        {
            name: 'offszn-upload-draft',
            // We don't persist files (Blobs/Files are not serializable)
            partialize: (state) => {
                const { files, coverImage, ...rest } = state;
                return rest;
            },
        }
    )
);
