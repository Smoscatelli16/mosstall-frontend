// src/app/admin/layout.tsx
import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-red-900/20 border-b border-red-900/50 p-2 text-center text-xs font-bold text-red-400 uppercase tracking-widest">
        Entorno de Administración Restringido
      </header>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}