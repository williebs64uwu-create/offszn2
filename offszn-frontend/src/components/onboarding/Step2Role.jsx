import React, { useState } from 'react';
import { Music, Mic, PenTool, Sliders, PlayCircle, Briefcase, User } from 'lucide-react';

const Step2Role = ({ onNext, onBack, initialData }) => {
    const [selectedRole, setSelectedRole] = useState(initialData.role || '');

    const roles = [
        { value: 'Productor Musical', label: 'Productor Musical', icon: Music },
        { value: 'Artista / Cantante', label: 'Artista / Cantante', icon: Mic },
        { value: 'Compositor / Songwriter', label: 'Compositor / Songwriter', icon: PenTool },
        { value: 'Ingeniero de Mezcla/Master', label: 'Ingeniero de Mezcla/Master', icon: Sliders },
        { value: 'Músico / Instrumentista', label: 'Músico / Instrumentista', icon: PlayCircle },
        { value: 'Otro Rol Musical', label: 'Otro Rol Musical', icon: Briefcase },
        { value: 'Fan / Consumidor', label: 'Fan / Consumidor', icon: User }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedRole) {
            onNext({ role: selectedRole });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">¿Qué eres?</h1>
                <p className="text-zinc-400">Ayúdanos a personalizar tu experiencia</p>
            </div>

            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-4">
                {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.value;

                    return (
                        <button
                            key={role.value}
                            type="button"
                            onClick={() => setSelectedRole(role.value)}
                            className={`p-6 rounded-xl border-2 transition-all ${isSelected
                                ? 'bg-white border-white text-black'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600'
                                }`}
                        >
                            <Icon className={`w-8 h-8 mx-auto mb-3 ${isSelected ? 'text-black' : 'text-zinc-500'}`} />
                            <span className="block text-sm font-semibold">{role.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6 border-t border-zinc-800">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-8 py-3 bg-transparent border border-zinc-800 text-zinc-300 font-semibold rounded-lg hover:border-zinc-600 hover:text-white transition-colors"
                >
                    Atrás
                </button>
                <button
                    type="submit"
                    disabled={!selectedRole}
                    className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente
                </button>
            </div>
        </form>
    );
};

export default Step2Role;
