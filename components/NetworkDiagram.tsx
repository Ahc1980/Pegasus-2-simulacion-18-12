
import React from 'react';
import { Settings, Home, Gauge, Waves } from 'lucide-react';

interface NetworkDiagramProps {
  flow: number;
  pOutlet: number;
  pCritical: number;
}

const NetworkDiagram: React.FC<NetworkDiagramProps> = ({ flow, pOutlet, pCritical }) => {
  // Calcular velocidad de animación basada en el caudal
  const animationDuration = Math.max(0.5, 10 / (flow / 5));

  return (
    <div className="relative w-full h-64 bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex items-center justify-between overflow-hidden">
      {/* Cuadrícula de fondo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* Estación de Válvula Pegasus */}
      <div className="flex flex-col items-center z-10">
        <div className="bg-blue-600 p-4 rounded-lg shadow-lg shadow-blue-500/20 mb-2 relative">
          <Settings className="w-10 h-10 text-white animate-[spin_8s_linear_infinite]" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">VRP Pegasus</span>
        <div className="mt-2 px-3 py-1 bg-slate-800 rounded text-xs font-mono">
          {pOutlet.toFixed(1)}m
        </div>
      </div>

      {/* Tubería con animación de agua */}
      <div className="flex-1 px-4 relative">
        <svg className="w-full h-8 overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          {/* Estructura principal de la tubería */}
          <rect x="0" y="8" width="100%" height="16" rx="8" fill="#1e293b" />
          {/* Trazo de flujo dinámico */}
          <line 
            x1="0" y1="16" x2="100%" y2="16" 
            stroke="url(#pipeGradient)" 
            strokeWidth="8" 
            strokeDasharray="15, 25"
            style={{ 
              animation: `flowAnimation ${animationDuration}s linear infinite`,
            }} 
          />
        </svg>
        <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Waves className="w-4 h-4 text-blue-400 opacity-60" />
          <span className="text-xs font-mono text-slate-400">{flow.toFixed(1)} L/s</span>
        </div>
      </div>

      {/* Punto Crítico */}
      <div className="flex flex-col items-center z-10">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-xl mb-2">
          <Home className="w-10 h-10 text-slate-300" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Punto Crítico</span>
        <div className="mt-2 px-3 py-1 bg-blue-900/40 rounded text-xs font-mono text-blue-300 border border-blue-500/30">
          {pCritical.toFixed(1)}m
        </div>
      </div>

      <style>{`
        @keyframes flowAnimation {
          from { stroke-dashoffset: 80; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default NetworkDiagram;
