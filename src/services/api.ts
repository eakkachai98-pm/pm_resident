import { Asset, Activity, Ticket, Personnel } from '../types';

const API_BASE = '/api';

export const api = {
  // AUTH
  async login(credentials: any): Promise<any> {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!response.ok) throw new Error('Invalid credentials');
    return response.json();
  },

  // METADATA
  async getMetadata(): Promise<{ categories: any[], departments: any[] }> {
    const response = await fetch(`${API_BASE}/metadata`);
    if (!response.ok) throw new Error('Failed to fetch metadata');
    return response.json();
  },

  async addCategory(name: string): Promise<any> {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return response.json();
  },

  async deleteCategory(id: string): Promise<any> {
    return fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
  },

  async addDepartment(name: string): Promise<any> {
    const response = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return response.json();
  },

  async deleteDepartment(id: string): Promise<any> {
    return fetch(`${API_BASE}/departments/${id}`, { method: 'DELETE' });
  },

  // ASSETS
  async getAssets(): Promise<Asset[]> {
    const response = await fetch(`${API_BASE}/assets`);
    if (!response.ok) throw new Error('Failed to fetch assets');
    return response.json();
  },

  async getAssetById(id: string): Promise<Asset> {
    const response = await fetch(`${API_BASE}/assets/${id}`);
    if (!response.ok) throw new Error('Failed to fetch asset');
    return response.json();
  },

  async getRooms(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/rooms`);
    if (!response.ok) throw new Error('Failed to fetch rooms');
    return response.json();
  },

  async createAsset(asset: any): Promise<Asset> {
    const response = await fetch(`${API_BASE}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset)
    });
    if (!response.ok) throw new Error('Failed to create asset');
    return response.json();
  },

  async updateAsset(id: string, asset: any): Promise<Asset> {
    const response = await fetch(`${API_BASE}/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset)
    });
    if (!response.ok) throw new Error('Failed to update asset');
    return response.json();
  },

  async deleteAsset(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/assets/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete asset');
    return response.json();
  },

  async updateAssetStatus(id: string, status: string): Promise<any> {
    const response = await fetch(`${API_BASE}/assets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update asset');
    return response.json();
  },

  // PERSONNEL
  async getPersonnel(): Promise<Personnel[]> {
    const response = await fetch(`${API_BASE}/personnel`);
    if (!response.ok) throw new Error('Failed to fetch personnel');
    return response.json();
  },

  async createPersonnel(person: any): Promise<Personnel> {
    const response = await fetch(`${API_BASE}/personnel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person)
    });
    if (!response.ok) throw new Error('Failed to create personnel');
    return response.json();
  },

  async updatePersonnel(id: string, person: any): Promise<Personnel> {
    const response = await fetch(`${API_BASE}/personnel/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person)
    });
    if (!response.ok) throw new Error('Failed to update personnel');
    return response.json();
  },

  async deletePersonnel(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/personnel/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete personnel');
    return response.json();
  },

  // TICKETS & TASKS
  async getTickets(): Promise<Ticket[]> {
    const response = await fetch(`${API_BASE}/tickets`);
    if (!response.ok) throw new Error('Failed to fetch tickets');
    return response.json();
  },

  async getAssetTickets(id: string): Promise<Ticket[]> {
    const response = await fetch(`${API_BASE}/assets/${id}/tickets`);
    if (!response.ok) throw new Error('Failed to fetch asset tickets');
    return response.json();
  },

  async createTicket(ticket: any): Promise<Ticket> {
    const response = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });
    if (!response.ok) throw new Error('Failed to create ticket');
    return response.json();
  },

  async updateTicketStatus(id: string, status: string, repairNotes?: string, assigneeId?: string, repairImage?: string, rating?: number, feedback?: string): Promise<any> {
    const response = await fetch(`${API_BASE}/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, repairNotes, assigneeId, repairImage, rating, feedback })
    });
    if (!response.ok) throw new Error('Failed to update ticket');
    return response.json();
  },

  async rateTicket(id: string, rating: number, feedback?: string): Promise<any> {
    const response = await fetch(`${API_BASE}/maintenance/${id}/rate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, feedback })
    });
    if (!response.ok) throw new Error('Failed to submit rating');
    return response.json();
  },

  async getTasks(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  async getActivities(days?: string | number): Promise<Activity[]> {
    const query = days ? `?days=${days}` : '';
    const response = await fetch(`${API_BASE}/activities${query}`);
    if (!response.ok) throw new Error('Failed to fetch activities');
    return response.json();
  },

  // STATS
  async getStats(): Promise<any> {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  // NOTIFICATIONS
  async getNotifications(userId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE}/notifications/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  async markNotificationAsRead(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH'
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
  },

  async getAnalytics(days?: string | number): Promise<any> {
    const query = days ? `?days=${days}` : '';
    const response = await fetch(`${API_BASE}/analytics${query}`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },

  async bulkCreateAssets(data: any[]): Promise<any> {
    const response = await fetch(`${API_BASE}/assets/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Bulk import failed');
    return response.json();
  },

  async bulkCreatePersonnel(data: any[]): Promise<any> {
    const response = await fetch(`${API_BASE}/personnel/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Bulk personnel import failed');
    return response.json();
  },

  async getSettings(): Promise<any> {
    const response = await fetch(`${API_BASE}/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  async saveSettings(settings: any): Promise<any> {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Failed to save settings');
    return response.json();
  }
};
