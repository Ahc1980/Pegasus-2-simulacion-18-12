
export interface SimulationData {
  time: number; // 0-23
  flow: number; // l/s
  pInlet: number; // meters
  pOutlet: number; // meters
  pCritical: number; // meters
  headLoss: number; // meters
  timestamp: string;
}

export interface SimulationState {
  currentHour: number;
  isPlaying: boolean;
  targetCP: number;
  history: SimulationData[];
}
