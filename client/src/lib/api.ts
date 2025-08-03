import type { Outage } from "@/types/outage";

export class OutageAPI {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async getOutages(filters?: { status?: string; zone?: string }): Promise<Outage[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.zone) params.append('zone', filters.zone);

    const url = `${this.baseUrl}/outages${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getOutageById(id: string): Promise<Outage> {
    const response = await fetch(`${this.baseUrl}/outages/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Outage not found');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async createOutage(outage: Omit<Outage, 'id' | 'createdAt' | 'updatedAt'>): Promise<Outage> {
    const response = await fetch(`${this.baseUrl}/outages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(outage),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async updateOutage(id: string, updates: Partial<Outage>): Promise<Outage> {
    const response = await fetch(`${this.baseUrl}/outages/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async deleteOutage(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/outages/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  }
}

export const outageAPI = new OutageAPI();
