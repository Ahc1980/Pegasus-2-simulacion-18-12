
import { K_FRICTION } from '../constants';

export const MIN_OUTLET_PRESSURE = 5.0;

/**
 * Simula la demanda residencial (Caudal)
 * Picos a las 8:00 y 20:00
 */
export const calculateFlow = (hour: number): number => {
  const peak1 = Math.exp(-0.5 * Math.pow((hour - 8) / 2, 2));
  const peak2 = Math.exp(-0.5 * Math.pow((hour - 20) / 2.2, 2));
  const baseFlow = 5 + 3 * Math.sin((hour * Math.PI) / 12);
  const flow = Math.max(2, baseFlow + 25 * peak1 + 18 * peak2);
  // Añadir pequeño ruido al caudal
  return flow + (Math.random() - 0.5) * 0.5;
};

/**
 * Simula la presión de entrada dinámica (Inversa al caudal)
 * De noche sube la presión, de día baja por el consumo de la red troncal
 */
export const calculateDynamicInlet = (hour: number, baseInlet: number): number => {
  // Oscilación base: máxima a las 3:00 AM (noche), mínima a las 15:00 PM (día)
  const oscillation = 12 * Math.cos(((hour - 3) * Math.PI) / 12);
  // Ruido de red realista (golpes de ariete menores, variaciones de bombas aguas arriba)
  const noise = (Math.random() - 0.5) * 3.0; 
  return baseInlet + oscillation + noise;
};

export const calculateHeadLoss = (flow: number, kFriction: number): number => {
  return kFriction * Math.pow(flow, 2);
};

/**
 * Calcula la salida de la VRP según modo y restricciones
 */
export const calculateRequiredOutlet = (
  mode: 'PEGASUS' | 'FIXED',
  target: number, 
  headLoss: number, 
  pInlet: number
): number => {
  let required = mode === 'PEGASUS' ? (target + headLoss) : target;
  
  // Suelo técnico de 5m
  required = Math.max(required, MIN_OUTLET_PRESSURE);
  
  // No puede entregar más de lo que entra (menos pérdida mínima de la válvula)
  return Math.min(required, pInlet - 5.0); 
};
