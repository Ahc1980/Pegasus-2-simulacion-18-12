
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { SimulationData } from '../types';

interface HydraulicGraphProps {
  data: SimulationData[];
  visibility: {
    pInlet: boolean;
    flow: boolean;
    pOutlet: boolean;
    pCritical: boolean;
  };
}

const HydraulicGraph: React.FC<HydraulicGraphProps> = ({ data, visibility }) => {
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            stroke="#64748b" 
            fontSize={10} 
            tickMargin={10}
            axisLine={false}
            tick={{ fill: '#475569', fontWeight: 'bold' }}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={10} 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#475569', fontWeight: 'bold' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '10px' }}
            itemStyle={{ padding: '2px 0' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} 
          />
          
          {visibility.pInlet && (
            <Line 
              name="Presión Aguas Arriba (m)" 
              type="monotone" 
              dataKey="pInlet" 
              stroke="#6366f1" 
              strokeWidth={2} 
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
          )}
          {visibility.flow && (
            <Line 
              name="Caudal (L/s)" 
              type="monotone" 
              dataKey="flow" 
              stroke="#f59e0b" 
              strokeWidth={3} 
              dot={false}
              isAnimationActive={false}
            />
          )}
          {visibility.pOutlet && (
            <Line 
              name="Presión Salida VRP (m)" 
              type="monotone" 
              dataKey="pOutlet" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={false}
              isAnimationActive={false}
            />
          )}
          {visibility.pCritical && (
            <Line 
              name="Presión Punto Crítico (m)" 
              type="monotone" 
              dataKey="pCritical" 
              stroke="#10b981" 
              strokeWidth={3} 
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HydraulicGraph;
