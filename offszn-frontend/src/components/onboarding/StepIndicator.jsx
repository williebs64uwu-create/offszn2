import React from 'react';

const StepIndicator = ({ currentStep, totalSteps, steps: customSteps }) => {
    const defaultSteps = [
        { num: 1, label: 'Básico' },
        { num: 2, label: 'Rol' },
        { num: 3, label: 'Social' },
        { num: 4, label: 'Avatar' }
    ];

    const steps = customSteps || defaultSteps;
    const actualTotalSteps = totalSteps || steps.length;

    const progressPercent = ((currentStep - 1) / (actualTotalSteps - 1)) * 100;

    return (
        <div className="w-full max-w-2xl mx-auto px-6 py-8">
            <div className="relative flex justify-between items-center">
                {/* Progress Line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-800 -translate-y-1/2 z-0" />
                <div
                    className="absolute top-1/2 left-0 h-px bg-white -translate-y-1/2 z-0 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                />

                {/* Steps */}
                {steps.map((step) => (
                    <div key={step.num} className="relative z-10 flex flex-col items-center gap-2">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${step.num < currentStep
                                ? 'bg-white text-black'
                                : step.num === currentStep
                                    ? 'bg-white text-black'
                                    : 'bg-zinc-900 text-zinc-600 border-2 border-zinc-800'
                                }`}
                        >
                            {step.num}
                        </div>
                        <span
                            className={`text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${step.num === currentStep ? 'text-white' : 'text-zinc-600'
                                }`}
                        >
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StepIndicator;
