export interface Outage {
  id: string;
  status: 'active' | 'planned' | 'resolved';
  zone: string;
  municipality: string;
  province: string;
  latitude: string;
  longitude: string;
  affectedUsers: number;
  cause?: string | null;
  startTime: string | Date;
  lastUpdate: string | Date;
  estimatedResolution?: string | Date | null;
  actualResolution?: string | Date | null;
  isPlanned: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface OutageFilters {
  status: {
    active: boolean;
    planned: boolean;
    resolved: boolean;
  };
  zone: string;
}

export interface OutageStats {
  totalActive: number;
  totalPlanned: number;
  totalResolved: number;
  totalAffected: number;
  avgDuration: string;
}
