// src/components/icons/LogoIcon.tsx
import React from "react";

export const LogoIcon = ({ className }: { className?: string }) => {
  return (
    // Versión simple: Un cuadrado azul con una "M"
    <svg 
      className={className} 
      viewBox="0 0 50 50" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
       <rect width="50" height="50" rx="10" fill="#3B82F6" />
       <text x="12" y="35" fill="white" fontSize="30" fontWeight="bold" fontFamily="sans-serif">
         M
       </text>
    </svg>
  );
};