// src/app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="container mx-auto max-w-5xl space-y-8 animate-pulse">
        {/* Cabecera y botones */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="h-8 bg-gray-200 rounded-md w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded-md w-48"></div>
          </div>
          <div className="flex gap-2">
             <div className="h-10 bg-gray-200 rounded-full w-24"></div>
             <div className="h-10 bg-gray-200 rounded-full w-24"></div>
          </div>
        </div>
        
        {/* HUD Financiero */}
        <div className="h-32 bg-gray-200 rounded-3xl w-full"></div>
        
        {/* Tabs de navegación */}
        <div className="flex gap-4 border-b border-gray-200 pb-3 overflow-hidden">
          <div className="h-6 bg-gray-200 rounded-md w-24"></div>
          <div className="h-6 bg-gray-200 rounded-md w-28"></div>
          <div className="h-6 bg-gray-200 rounded-md w-24"></div>
          <div className="h-6 bg-gray-200 rounded-md w-32"></div>
        </div>
        
        {/* Contenedor principal */}
        <div className="h-64 bg-white border border-gray-100 rounded-3xl w-full"></div>
      </div>
    </main>
  );
}