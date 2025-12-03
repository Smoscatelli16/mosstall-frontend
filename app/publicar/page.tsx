// Esta es la página de Publicación: http://localhost:3000/publicar

"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function PublishPage() {
  
  // Estados para el formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    // --- ¡AQUÍ ESTÁ LA NUEVA LÓGICA DE SEGURIDAD! ---
    
    // 1. Buscamos el "pase" (token) que guardamos en el login
    const token = localStorage.getItem('token');

    // 2. Si no hay "pase", no podemos continuar.
    if (!token) {
      setMessage('Error: Debes iniciar sesión para poder publicar.');
      return;
    }

    // 3. Intentamos enviar los datos AL BACKEND, incluyendo el "pase"
    try {
      const response = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 4. ¡¡LA LÍNEA MÁS IMPORTANTE!!
          // Enviamos el "pase" en el encabezado de Autorización.
          // El "guardia" (authMiddleware) del backend está esperando esto.
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          title: title, 
          description: description, 
          price: price // El backend se encargará de convertirlo a número
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // ¡Éxito!
        setMessage(`¡Producto "${data.title}" creado con éxito!`);
        // Limpiamos los campos
        setTitle('');
        setDescription('');
        setPrice('');
      } else {
        // Error (ej: token expirado, datos faltantes, etc.)
        setMessage(`Error al publicar: ${data.error}`);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setMessage('Error: No se pudo conectar con el servidor.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-lg rounded-lg bg-gray-800 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">Publicar un Nuevo Producto</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo de Título */}
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium">Título del Producto</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Campo de Precio */}
          <div>
            <label htmlFor="price" className="mb-2 block text-sm font-medium">Precio ($)</label>
            <input
              type="number" // El tipo "number" ayuda en el navegador
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white focus:border-blue-500 focus:ring-blue-500"
              required
              min="0"
              step="0.01" // Permite centavos
            />
          </div>

          {/* Campo de Descripción */}
          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium">Descripción</label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-2.5 text-white focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>


          {/* Botón de Envío */}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800"
          >
            Publicar Producto
          </button>
        </form>

        {/* Mensaje de éxito o error */}
        {message && (
          <p className="mt-4 text-center text-sm text-yellow-300">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-gray-400">
          <Link href="/" className="font-medium text-blue-500 hover:underline">
            Volver (Registro)
          </Link>
          {' | '}
          <Link href="/login" className="font-medium text-blue-500 hover:underline">
            Ir a Login
          </Link>
        </p>
      </div>
    </main>
  );
}