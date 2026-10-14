// src/app/profile/[id]/loading.tsx
export default function ProfileLoading() {
    return (
        <main className="min-h-screen bg-slate-50 text-gray-900 pb-20 font-sans animate-pulse">
            {/* Header del Perfil */}
            <div className="bg-white border-b border-gray-100 pb-10 pt-16 px-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gray-100/50 transform -skew-y-2 origin-top-left -z-10"></div>
                <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                    <div className="h-32 w-32 rounded-3xl bg-gray-200 shadow-lg shrink-0 border-4 border-white"></div>
                    <div className="text-center md:text-left grow pt-2 w-full">
                        <div className="h-10 bg-gray-200 rounded-xl w-3/4 max-w-sm mb-3 mx-auto md:mx-0"></div>
                        <div className="h-6 bg-gray-200 rounded-xl w-1/2 max-w-xs mx-auto md:mx-0"></div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-5">
                            <div className="h-8 bg-gray-200 rounded-xl w-32"></div>
                            <div className="h-8 bg-gray-200 rounded-xl w-40"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cuerpo del Perfil */}
            <div className="container mx-auto max-w-5xl px-4 mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm h-48 flex flex-col gap-3">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm h-64 flex flex-col gap-3">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
                    </div>
                </div>
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-80">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
                        <div className="space-y-4">
                            <div className="h-20 bg-gray-100 rounded-2xl w-full"></div>
                            <div className="h-20 bg-gray-100 rounded-2xl w-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}