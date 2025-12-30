// src/components/icons/LogoFull.tsx
import React from "react";

export const LogoFull = ({ className }: { className?: string }) => {
  return (
    // Versión simple y ligera para desbloquearte
    <svg 
      className={className} 
      viewBox="0 0 200 50" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
       <text x="0" y="35" fill="white" fontSize="32" fontWeight="bold" fontFamily="sans-serif">
         MossTall
       </text>
    </svg>
  );
};