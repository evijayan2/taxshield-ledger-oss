import { AllAppData } from './storage';

export interface PostgresStatus {
  configured: boolean;
  connected: boolean;
  message: string;
  provider?: string;
  host?: string;
  database?: string;
  tableCounts?: Record<string, number>;
  help?: string;
  error?: string;
  isLocal?: boolean;
}

export async function getPostgresStatus(): Promise<PostgresStatus> {
  try {
    const res = await fetch('/api/postgres/status');
    if (!res.ok) {
      return {
        configured: false,
        connected: false,
        message: `HTTP Error: ${res.statusText}`,
      };
    }
    return await res.json();
  } catch (err: any) {
    return {
      configured: false,
      connected: false,
      message: `Failed to reach server backend: ${err.message}`,
    };
  }
}

export async function fetchServerAppData(): Promise<{ source: 'postgres' | 'error'; error?: string; data: AllAppData | null }> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: res.statusText }));
      return { source: 'error', error: errJson.error || res.statusText, data: null };
    }
    return await res.json();
  } catch (err: any) {
    return { source: 'error', error: `Network error connecting to backend: ${err.message}`, data: null };
  }
}

export async function saveServerAppData(data: AllAppData): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      return { success: false, error: res.statusText };
    }
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function initPostgresDatabase(): Promise<{ success: boolean; message: string; tableCounts?: Record<string, number> }> {
  try {
    const res = await fetch('/api/postgres/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
