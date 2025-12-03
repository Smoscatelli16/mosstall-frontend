// Este archivo es la página de Login: http://localhost:3000/login

"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <-- ¡CRÍTICO! Hook de navegación

export default function LoginPage() {
  
  // Instanciamos el router para poder redirigir
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  
  // Nuevo estado para controlar la interfaz durante la petición
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true); // 1. Bloqueamos la UI al empezar

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 2. ¡Éxito!
        setMessage('¡Bienvenido! Ingresando a MossTall...');
        
        // Guardamos el token
        localStorage.setItem('token', data.token);

        // 3. REDIRECCIÓN AUTOMÁTICA
        router.push('/');
        router.refresh(); // Opcional: Fuerza un refresco de los componentes de servidor (Navbar)

        // Nota: NO ponemos setIsLoading(false) aquí para que el botón siga
        // mostrando "Ingresando..." mientras la página cambia.

      } else {
        // Error de credenciales
        setMessage(`Error: ${data.error}`);
        setIsLoading(false); // Desbloqueamos para que intente de nuevo
      }

    } catch (error) {
      console.error('Error de conexión:', error);
      setMessage('Error: No se pudo conectar con el servidor.');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg border border-gray-700">
        <h1 className="mb-6 text-center text-3xl font-bold text-blue-400">MossTall</h1>
        <h2 className="mb-6 text-center text-xl font-medium text-gray-200">Iniciar Sesión</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo de Email */}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading} // Bloqueado si está cargando
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              placeholder="tu@email.com"
              required
            />
          </div>

          {/* Campo de Contraseña */}
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-300">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Botón de Envío con Estado de Carga */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-lg px-5 py-3 text-center font-bold text-white transition-all transform 
              ${isLoading 
                ? 'bg-blue-800 cursor-wait' 
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] focus:ring-4 focus:ring-blue-800 shadow-lg shadow-blue-900/50'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ingresando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Mensaje de Feedback */}
        {message && (
          <div className={`mt-6 p-3 rounded text-center text-sm font-medium animate-fade-in
            ${message.includes('Error') ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-green-900/30 text-green-300 border border-green-800'}
          `}>
            {message}
          </div>
        )}

        <div className="mt-8 border-t border-gray-700 pt-6 text-center">
          <p className="text-sm text-gray-400">
            ¿No tenés una cuenta en MossTall?{' '}
            <Link href="/" className="font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors">
              Registrate acá
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}