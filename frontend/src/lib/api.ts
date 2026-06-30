import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const leadApi = {
  getLeads: async () => {
    const { data } = await api.get('/leads/');
    return data;
  },
  getLead: async (id: number) => {
    const { data } = await api.get(`/leads/${id}`);
    return data;
  },
  createLead: async (lead: any) => {
    const { data } = await api.post('/leads/', lead);
    return data;
  },
  updateLead: async (id: number, lead: any) => {
    const { data } = await api.put(`/leads/${id}`, lead);
    return data;
  },
  deleteLead: async (id: number) => {
    const { data } = await api.delete(`/leads/${id}`);
    return data;
  },
  getAnalysis: async (id: number) => {
    const { data } = await api.get(`/leads/${id}/analysis`);
    return data;
  },
  createAnalysis: async (id: number, analysis: any) => {
    const { data } = await api.post(`/leads/${id}/analysis`, analysis);
    return data;
  },
  getPendingOutreaches: async () => {
    const { data } = await api.get('/outreaches/pending');
    return data;
  },
  sendOutreach: async (id: number) => {
    const { data } = await api.post(`/outreaches/${id}/send`);
    return data;
  },
  rejectOutreach: async (id: number) => {
    const { data } = await api.post(`/outreaches/${id}/reject`);
    return data;
  },
  scrapeLeads: async (category: string, location: string, platform: string) => {
    const { data } = await api.post('/leads/scrape', { category, location, platform });
    return data;
  }
};
