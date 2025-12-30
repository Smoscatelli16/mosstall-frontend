// src/app/register/page.tsx

"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <-- 1. IMPORTAR ROUTER

export default function RegisterPage() {
  const router = useRouter(); // <-- 2. INICIALIZAR ROUTER

  // --- Estados ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false); // Para cambiar color del mensaje

  // --- Manejador de Envío ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); 
    setIsSuccess(false);

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(`¡Bienvenido ${data.name}! Redirigiendo al login...`);
        
        // Limpiar campos
        setEmail('');
        setPassword('');
        setName('');

        // --- 3. REDIRECCIÓN AUTOMÁTICA ---
        setTimeout(() => {
            router.push('/login');
        }, 2000); // Espera 2 segundos y redirige

      } else {
        setIsSuccess(false);
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setMessage('Error: No se pudo conectar con el servidor.');
    }
  };

  // --- Renderizado ---
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg border border-gray-700">
        <h1 className="mb-6 text-center text-3xl font-bold">Crear cuenta en MossTall</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo de Nombre */}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-300">Nombre</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 outline-none"
              placeholder="Tu nombre completo"
              required
            />
          </div>

          {/* Campo de Email */}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 outline-none"
              placeholder="nombre@ejemplo.com"
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
              className="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-5 py-3 text-center font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800 transition-colors mt-2"
          >
            Registrarse
          </button>
        </form>

        {/* Mensaje de éxito o error */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center text-sm font-bold ${isSuccess ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'}`}>
            {message}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-400">
          ¿Ya tenés una cuenta?{' '}
          <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300 hover:underline">
            Iniciá sesión acá
          </Link>
        </p>
      </div>
    </main>
  );
}