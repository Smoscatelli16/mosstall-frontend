// Este archivo es la NUEVA página de Registro: http://localhost:3000/register

"use client";

import { useState } from 'react';
import Link from 'next/link'; // <-- IMPORTADO PARA EL LINK

export default function RegisterPage() {
  
  // --- Estados ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [message, setMessage] = useState('');

  // --- Manejador de Envío ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); 

    console.log('Enviando datos:', { email, name, password });

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
        setMessage(`¡Usuario ${data.name} creado con éxito!`);
        setEmail('');
        setPassword('');
        setName('');
      } else {
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
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">Crear cuenta en MossTall</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo de Nombre */}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">Nombre</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Campo de Email */}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Campo de Contraseña */}
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800"
          >
            Registrarse
          </button>
        </form>

        {/* Mensaje de éxito o error */}
        {message && (
          <p className="mt-4 text-center text-sm text-yellow-300">
            {message}
          </p>
        )}

        {/* --- ¡MEJORA AÑADIDA! --- */}
        <p className="mt-6 text-center text-sm text-gray-400">
          ¿Ya tenés una cuenta?{' '}
          <Link href="/login" className="font-medium text-blue-500 hover:underline">
            Iniciá sesión acá
          </Link>
        </p>
      </div>
    </main>
  );
}