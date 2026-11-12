// src/components/SearchTracker.tsx
"use client";

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

interface SearchTrackerProps {
    searchParams: any;
    resultsCount: number;
}

export default function SearchTracker({ searchParams, resultsCount }: SearchTrackerProps) {
    const lastSearchStr = useRef('');

    useEffect(() => {
        // Convertimos a string para comparar fácil si cambiaron los filtros
        const currentSearchStr = JSON.stringify(searchParams);
        
        // Si hay parámetros (búsqueda activa) y es diferente a la última medición
        if (Object.keys(searchParams).length > 0 && currentSearchStr !== lastSearchStr.current) {
            const query = searchParams.search;
            const category = searchParams.category;
            const type = searchParams.type;

            // Evitamos disparar eventos por simple navegación de paginación
            if (query || category || type) {
                if (resultsCount === 0) {
                    // DEMANDA INSATISFECHA (0 resultados)
                    posthog.capture('search_unmatched', {
                        search_query: query || '',
                        category_filter: category || null,
                        type_filter: type || null,
                        results_count: 0
                    });
                } else {
                    // BÚSQUEDA EXITOSA
                    posthog.capture('search_performed', {
                        search_query: query || '',
                        category_filter: category || null,
                        type_filter: type || null,
                        results_count: resultsCount
                    });
                }
            }
            lastSearchStr.current = currentSearchStr;
        }
    }, [searchParams, resultsCount]);

    return null; // Componente "fantasma", no renderiza nada visual
}