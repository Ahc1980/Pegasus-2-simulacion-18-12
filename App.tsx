
import React from 'react';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-200">
      {/* Fondos decorativos con desenfoque */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>
      
      <Dashboard />
      
      <footer className="max-w-7xl mx-auto px-8 py-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-600 text-[10px] uppercase font-bold tracking-[0.2em]">
        <div>© 2025 HWM Global - Suite de Simulación Hidráulica</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-blue-500 transition-colors">Documentación</a>
          <a href="#" className="hover:text-blue-500 transition-colors">Estado de Enlace GPRS</a>
          <a href="#" className="hover:text-blue-500 transition-colors">Gestión de Activos</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
