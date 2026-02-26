import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import StepIndicator from '../../components/onboarding/StepIndicator';
import Step1BasicInfo from '../../components/onboarding/Step1BasicInfo';
import Step2Role from '../../components/onboarding/Step2Role';
import Step3Social from '../../components/onboarding/Step3Social';
import Step4Avatar from '../../components/onboarding/Step4Avatar';
import { apiClient } from '../../api/client';
import logoImg from '../../assets/images/LOGO-OFFSZN.png';

const Welcome = () => {
    const [currentStep, setCurrentStep] = useState(2);
    const [formData, setFormData] = useState({
        nickname: '',
        firstName: '',
        lastName: '',
        role: '',
        socialLinks: {},
        avatarUrl: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const { user, profile, checkSession, loading } = useAuthStore();

    // Redirect if already completed profile
    useEffect(() => {
        checkSession();
        if (profile?.onboarding_completed) {
            navigate('/');
        }
    }, [profile, navigate, checkSession]);

    // Redirect if not logged in (Permitir si el usuario existe en el store aunque no tenga sesión de Supabase)
    useEffect(() => {
        if (!loading && !user) {
            navigate('/auth/login');
        }
    }, [user, loading, navigate]);

    const steps = [
        { num: 1, label: 'Cuenta' },
        { num: 2, label: 'Básico' },
        { num: 3, label: 'Rol' },
        { num: 4, label: 'Social' },
        { num: 5, label: 'Avatar' }
    ];

    const handleNext = (stepData) => {
        setFormData({ ...formData, ...stepData });
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        } else {
            completeOnboarding(stepData);
        }
    };

    const handleBack = () => {
        if (currentStep > 2) {
            setCurrentStep(currentStep - 1);
        }
    };

    const completeOnboarding = async (finalStepData) => {
        setIsSubmitting(true);
        try {
            const completeData = { ...formData, ...finalStepData };

            await apiClient.put('/auth/complete-profile', {
                nickname: completeData.nickname,
                firstName: completeData.firstName,
                lastName: completeData.lastName,
                role: completeData.role,
                socialLinks: completeData.socialLinks,
                avatarUrl: completeData.avatarUrl
            });

            // Refresh session to get updated profile
            await checkSession();

            // Redirect to home
            navigate('/');
        } catch (error) {
            console.error('Error completing profile:', error);
            alert('Hubo un error al completar tu perfil. Por favor intenta de nuevo.');
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <img src={logoImg} alt="OFFSZN" className="h-8 w-auto" />
                <button
                    onClick={() => navigate('/')}
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    Saltar por ahora
                </button>
            </header>

            {/* Progress Indicator */}
            <StepIndicator currentStep={currentStep} totalSteps={5} steps={steps} />

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-6 pb-12">
                <div className="w-full max-w-2xl">
                    {currentStep === 2 && (
                        <Step1BasicInfo
                            onNext={handleNext}
                            initialData={formData}
                        />
                    )}
                    {currentStep === 3 && (
                        <Step2Role
                            onNext={handleNext}
                            onBack={handleBack}
                            initialData={formData}
                        />
                    )}
                    {currentStep === 4 && (
                        <Step3Social
                            onNext={handleNext}
                            onBack={handleBack}
                            initialData={formData}
                        />
                    )}
                    {currentStep === 5 && (
                        <Step4Avatar
                            onNext={handleNext}
                            onBack={handleBack}
                            initialData={formData}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default Welcome;
