
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BarChart3, 
  Clock, 
  Settings2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Cpu, 
  ArrowRightLeft, 
  AlertTriangle, 
  CalendarDays,
  Sun,
  Moon,
  Zap,
  Target,
  Waves
} from 'lucide-react';
import { SimulationData } from '../types';
import { SIM_SPEED_MS, DEFAULT_TARGET_CP, P_INLET_BASE, K_FRICTION } from '../constants';
import { calculateFlow, calculateHeadLoss, calculateRequiredOutlet, calculateDynamicInlet } from '../utils/physics';
import NetworkDiagram from './NetworkDiagram';
import HydraulicGraph from './HydraulicGraph';
import { GoogleGenAI } from '@google/genai';

const Dashboard: React.FC = () => {
  const [currentHour, setCurrentHour] = useState(0);
  const [history, setHistory] = useState<SimulationData[]>([]);
  
  // controlMode: 'PEGASUS' es consigna en Punto Crítico, 'FIXED' es consigna en Salida VRP
  const [controlMode, setControlMode] = useState<'PEGASUS' | 'FIXED'>('PEGASUS');
  const [isScheduled, setIsScheduled] = useState(true);
  const [targetValue, setTargetValue] = useState(DEFAULT_TARGET_CP); 
  const [effectiveTarget, setEffectiveTarget] = useState(DEFAULT_TARGET_CP); 
  
  const [isManualInlet, setIsManualInlet] = useState(false);
  const [manualInletValue, setManualInletValue] = useState(P_INLET_BASE);
  const [kFriction, setKFriction] = useState(K_FRICTION);

  const [visibility, setVisibility] = useState({
    pInlet: true,
    flow: true,
    pOutlet: true,
    pCritical: true
  });

  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  const isDaytime = currentHour >= 6 && currentHour < 23;

  const getScheduledTarget = (hour: number) => {
    return (hour >= 6 && hour < 23) ? 22 : 10;
  };

  const generateDataPoint = useCallback((hour: number, effTarget: number): SimulationData => {
    const flow = calculateFlow(hour);
    const pInlet = isManualInlet ? manualInletValue : calculateDynamicInlet(hour, P_INLET_BASE);
    const headLoss = calculateHeadLoss(flow, kFriction);
    const pOutlet = calculateRequiredOutlet(controlMode, effTarget, headLoss, pInlet);
    const pCritical = pOutlet - headLoss;

    return {
      time: hour,
      flow,
      pInlet,
      pOutlet,
      pCritical,
      headLoss,
      timestamp: `${hour.toString().padStart(2, '0')}:00`
    };
  }, [controlMode, isManualInlet, manualInletValue, kFriction]);

  useEffect(() => {
    const actuatorSpeed = 12.0; 
    
    timerRef.current = window.setInterval(() => {
      setCurrentHour(prevHour => {
        const nextHour = (prevHour + 1) % 24;
        
        if (isScheduled) {
          setTargetValue(getScheduledTarget(nextHour));
        }

        setEffectiveTarget(prevEff => {
          const diff = targetValue - prevEff;
          if (Math.abs(diff) < actuatorSpeed) return targetValue;
          return prevEff + (diff > 0 ? actuatorSpeed : -actuatorSpeed);
        });

        const newDataPoint = generateDataPoint(nextHour, effectiveTarget);
        setHistory(h => {
          const newH = [...h.slice(1), newDataPoint];
          return newH.length > 24 ? newH.slice(newH.length - 24) : newH;
        });

        return nextHour;
      });
    }, SIM_SPEED_MS);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [generateDataPoint, targetValue, effectiveTarget, isScheduled]);

  useEffect(() => {
    const initial = Array.from({ length: 24 }, (_, i) => generateDataPoint(i, getScheduledTarget(i)));
    setHistory(initial);
    setEffectiveTarget(getScheduledTarget(0));
    setTargetValue(getScheduledTarget(0));
  }, []);

  const currentData = history[history.length - 1] || generateDataPoint(currentHour, effectiveTarget);
  const isAlarm = targetValue > (currentData.pInlet - 5);
  const isMoving = Math.abs(effectiveTarget - targetValue) > 0.1;

  const getGeminiInsight = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analiza Pegasus VRP. Hora: ${currentData.timestamp} (${isDaytime ? 'Día' : 'Noche'}). 
      Modo: ${controlMode === 'PEGASUS' ? 'Punto Crítico' : 'Salida VRP'}.
      Target: ${targetValue}m. Entrada: ${currentData.pInlet.toFixed(1)}m. 
      Caudal: ${currentData.flow.toFixed(1)} L/s. 
      Explica la diferencia entre regular en el punto crítico vs regular en la salida. Responde en español de forma técnica pero concisa.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiInsight(response.text || 'Sin diagnóstico.');
    } catch (err) {
      setAiInsight('Error de IA.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
      <header className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 p-6 rounded-r-2xl shadow-2xl relative overflow-hidden transition-all duration-1000 ${isDaytime ? 'bg-slate-900 border-blue-600' : 'bg-slate-950 border-indigo-900'}`}>
        <div className="flex items-center gap-4 z-10">
          <div className={`p-3 rounded-lg relative ${isAlarm ? 'bg-red-600' : isDaytime ? 'bg-blue-600' : 'bg-indigo-900'}`}>
            <Cpu className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">
              Gemelo Digital <span className={isDaytime ? 'text-blue-500' : 'text-indigo-400'}>Pegasus</span>
            </h1>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-green-500" /> Telemetría OK</span>
              <span className={`flex items-center gap-1 ${isMoving ? 'text-amber-500' : 'text-slate-600'}`}>
                {isMoving ? 'Actuador ajustando...' : 'Consigna establecida'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-black/40 px-6 py-4 rounded-xl border border-white/5 shadow-inner z-10">
          <div className="flex flex-col items-center justify-center">
            {isDaytime ? (
              <Sun className="w-6 h-6 text-amber-400 animate-[spin_10s_linear_infinite]" />
            ) : (
              <Moon className="w-6 h-6 text-indigo-300 animate-pulse" />
            )}
            <span className="text-[8px] font-black uppercase mt-1 opacity-60">
              {isDaytime ? 'Día' : 'Noche'}
            </span>
          </div>
          <div className="w-px h-8 bg-white/10 mx-1" />
          <div className="flex flex-col">
            <span className="text-3xl font-mono font-black text-blue-400 tabular-nums">
              {currentData.timestamp}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          
          {/* Módulo de Control */}
          <div className={`bg-slate-900 border rounded-2xl p-6 shadow-xl transition-all ${isAlarm ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-800'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> Modulación Horaria
              </h2>
              <button 
                onClick={() => setIsScheduled(!isScheduled)}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                  isScheduled ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isScheduled ? 'AUTO (22/10)' : 'MANUAL'}
              </button>
            </div>

            <div className="space-y-6">
              {/* Nuevo: Switch de Punto Crítico vs Salida VRP */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Referencia de Consigna</span>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button 
                    onClick={() => setControlMode('PEGASUS')}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${controlMode === 'PEGASUS' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Target className="w-3 h-3" />
                    PUNTO CRÍTICO
                  </button>
                  <button 
                    onClick={() => setControlMode('FIXED')}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${controlMode === 'FIXED' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    SALIDA VRP
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 italic px-1">
                  {controlMode === 'PEGASUS' 
                    ? '* El sistema compensa pérdidas de carga para mantener el target en el extremo de la red.' 
                    : '* La válvula mantiene el target exactamente en su salida, ignorando pérdidas aguas abajo.'}
                </p>
              </div>

              {isScheduled ? (
                <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Estado Actual:</span>
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-bold ${isDaytime ? 'bg-amber-400/10 text-amber-500' : 'bg-indigo-400/10 text-indigo-400'}`}>
                      {isDaytime ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                      {isDaytime ? 'PERFIL DÍA' : 'PERFIL NOCHE'}
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-4xl font-mono font-black text-blue-400">
                      {targetValue}<span className="text-sm font-bold ml-1 opacity-50">m</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-black text-slate-500 uppercase">Próximo Cambio</div>
                      <div className="text-[11px] font-mono text-slate-300">{isDaytime ? '23:00 → 10m' : '06:00 → 22m'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <ControlSlider 
                  label={`Target (${controlMode === 'PEGASUS' ? 'CP' : 'Salida'})`} 
                  value={targetValue} 
                  min={5} max={60} unit="m"
                  onChange={setTargetValue}
                  highlight={isAlarm}
                />
              )}

              {/* Histéresis del Actuador */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 mb-2">
                  <span>Posición Real del Actuador</span>
                  <span className={isMoving ? 'text-amber-500' : 'text-green-500'}>
                    {isMoving ? 'Ajustando...' : 'En Consigna'}
                  </span>
                </div>
                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-300 ease-linear ${isAlarm ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${(effectiveTarget / 60) * 100}%` }}
                  />
                  <div 
                    className="absolute top-0 h-full w-0.5 bg-white shadow-[0_0_8px_white]"
                    style={{ left: `${(targetValue / 60) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>{effectiveTarget.toFixed(1)}m</span>
                  <span>{targetValue.toFixed(0)}m</span>
                </div>
              </div>

              {isAlarm && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-red-400 leading-tight uppercase">
                    Alarma: Consigna inalcanzable. La presión de entrada ({currentData.pInlet.toFixed(1)}m) es insuficiente.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Configuración de Aguas Arriba */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Presión Aguas Arriba
              </h2>
              <button 
                onClick={() => setIsManualInlet(!isManualInlet)}
                className={`text-[9px] font-black px-2 py-1 rounded ${isManualInlet ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}
              >
                {isManualInlet ? 'FORZAR MANUAL' : 'SIMULAR RED'}
              </button>
            </div>
            <div className="space-y-6">
              <div className={!isManualInlet ? 'opacity-40 grayscale pointer-events-none' : ''}>
                <ControlSlider label="Entrada Manual" value={manualInletValue} min={10} max={90} unit="m" onChange={setManualInletValue} />
              </div>
              <p className="text-[9px] text-slate-500 leading-tight italic">
                * En modo 'Simular Red', la presión de entrada sube de noche por bajo consumo y cae de día por alta demanda.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <button onClick={getGeminiInsight} disabled={isAiLoading} className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-black hover:bg-blue-500 transition-all shadow-lg mb-4 flex items-center justify-center gap-2">
              <Zap className="w-3 h-3" /> {isAiLoading ? 'ANALIZANDO...' : 'DIAGNÓSTICO PEGASUS'}
            </button>
            <div className="text-[10px] text-slate-400 leading-relaxed font-mono italic">
              {aiInsight || "> Monitorizando transitorios de presión en red..."}
            </div>
          </div>
        </div>

        {/* Telemetría y Gráficos */}
        <div className="lg:col-span-8 space-y-6">
          <NetworkDiagram flow={currentData.flow} pOutlet={currentData.pOutlet} pCritical={currentData.pCritical} />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="P. Aguas Arriba" value={currentData.pInlet} unit="m" color="text-indigo-400" alarm={isAlarm} />
              <StatCard label="P. Salida VRP" value={currentData.pOutlet} unit="m" color="text-blue-400" />
              <StatCard label="Caudal Red" value={currentData.flow} unit="L/s" color="text-amber-400" />
              <StatCard label="Presión CP" value={currentData.pCritical} unit="m" color="text-green-400" />
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Telemetría GPRS Real-Time</h3>
                  <p className="text-[9px] text-slate-600 uppercase font-bold mt-1">Historial de las últimas 24 horas de operación</p>
                </div>
                <div className="flex gap-2">
                   <LegendItem label="Entrada" active={visibility.pInlet} color="bg-indigo-500" onClick={() => setVisibility(v => ({...v, pInlet: !v.pInlet}))} />
                   <LegendItem label="Caudal" active={visibility.flow} color="bg-amber-500" onClick={() => setVisibility(v => ({...v, flow: !v.flow}))} />
                   <LegendItem label="VRP" active={visibility.pOutlet} color="bg-blue-500" onClick={() => setVisibility(v => ({...v, pOutlet: !v.pOutlet}))} />
                   <LegendItem label="CP" active={visibility.pCritical} color="bg-green-500" onClick={() => setVisibility(v => ({...v, pCritical: !v.pCritical}))} />
                </div>
             </div>
             <HydraulicGraph data={history} visibility={visibility} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, unit, color, alarm }: any) => (
  <div className={`bg-slate-900 border p-4 rounded-xl transition-all duration-300 ${alarm && label === 'P. Aguas Arriba' ? 'border-red-500 bg-red-500/5' : 'border-slate-800'}`}>
    <div className="flex justify-between items-center mb-1">
      <div className="text-[9px] font-bold text-slate-500 uppercase">{label}</div>
    </div>
    <div className={`text-2xl font-mono font-black ${alarm && label === 'P. Aguas Arriba' ? 'text-red-500' : color}`}>
      {value.toFixed(1)}<span className="text-xs ml-1 opacity-50">{unit}</span>
    </div>
  </div>
);

const LegendItem = ({ label, active, color, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${active ? 'bg-slate-800 border-slate-700' : 'opacity-30 grayscale border-transparent'}`}>
    <div className={`w-2 h-2 rounded-full ${color}`} />
    <span className="text-[9px] font-bold text-slate-300 uppercase">{label}</span>
  </button>
);

const ControlSlider = ({ label, value, min, max, unit, step = 1, onChange, highlight }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-bold">
      <span className="text-slate-500 uppercase">{label}</span>
      <span className={highlight ? 'text-red-500' : 'text-blue-400'}>{value.toFixed(0)}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer transition-all ${highlight ? 'accent-red-600' : 'accent-blue-600'}`} />
  </div>
);

export default Dashboard;
