import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: BASE_URL });

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ht_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const sendOtp = (phone: string) =>
  api.post('/api/auth/send-otp', { phone });

export const verifyOtp = (phone: string, otp: string) =>
  api.post('/api/auth/verify-otp', { phone, otp });

// ── Events ────────────────────────────────────────────────────────────────────
export const getAllEvents = () => api.get('/api/events');

export const getEventById = (eventId: string | number) =>
  api.get(`/api/events/${eventId}`);

// ── Tickets ───────────────────────────────────────────────────────────────────
export const getAllBookings = () => api.get('/api/tickets/all-bookings');

export const bookTicket = (eventId: string | number, paymentReference: string) =>
  api.post('/api/tickets/book', { eventId, paymentReference });

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Event {
  eventId: number | string;
  name: string;
  location: string;
  date: string;
  price: string;
  capacity: string;
  ticketsSold: string;
  active: boolean;
  availableTickets: string;
}

export interface Ticket {
  ticketId: string;
  eventId: string;
  eventName: string;
  eventLocation: string;
  eventDate: string;
  eventPrice?: string;
  used: boolean;
  paymentId: string;
}

export default api;
