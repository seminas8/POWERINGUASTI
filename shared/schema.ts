// Simple TypeScript types for outage data (no database)

export interface Outage {
  id: string;
  status: 'active' | 'planned' | 'resolved';
  zone: string;
  municipality: string;
  province: string;
  latitude: string;
  longitude: string;
  affectedUsers: number;
  cause: string;
  startTime: Date;
  lastUpdate: Date;
  estimatedResolution: Date | null;
  actualResolution: Date | null;
  isPlanned: boolean;
}

export type InsertOutage = Omit<Outage, 'id'>;