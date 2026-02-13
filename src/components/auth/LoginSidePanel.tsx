import React from 'react';

interface LoginSidePanelProps {
    imageSrc: string;
    title: string;
    description: string;
    backgroundGradient?: string;
}

export const LoginSidePanel: React.FC<LoginSidePanelProps> = ({
    imageSrc,
    title,
    description,
    backgroundGradient = "bg-gradient-to-br from-indigo-600 to-violet-700"
}) => {
    return (
        <div className={`hidden lg:flex flex-col relative overflow-hidden ${backgroundGradient} p-12 text-white h-full`}>
            <div className="absolute inset-0 bg-[url('/pattern-bg.png')] opacity-10"></div>

            <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center">
                <div className="mb-8 relative w-full max-w-lg aspect-square">
                    <img
                        src={imageSrc}
                        alt="Feature Illustration"
                        className="w-full h-full object-contain drop-shadow-2xl animate-float"
                    />
                </div>

                <div className="max-w-md mx-auto">
                    <h2 className="text-3xl font-bold mb-4">{title}</h2>
                    <p className="text-indigo-100 text-lg opacity-90">
                        {description}
                    </p>
                </div>
            </div>

            <div className="absolute top-1/4 right-0 transform translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute bottom-0 left-0 transform -translate-x-1/3 translate-y-1/3 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-30"></div>
        </div>
    );
};
