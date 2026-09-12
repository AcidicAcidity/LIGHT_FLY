import { request } from './client.js'
import type {
  Airline,
  Airport,
  AirportInfo,
  AuthPurpose,
  AuthUser,
  Booking,
  CabinClass,
  Flight,
  Profile,
} from './types.js'

export * from './types.js'
export { ApiError, setAuthToken } from './client.js'

// --- Auth ---
export interface CodeResponse {
  message: string
  email: string
  purpose: AuthPurpose
  devCode?: string
}
export interface AuthResponse {
  token: string
  user: AuthUser
}

export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    request<CodeResponse>('/auth/register', { method: 'POST', body: data }),
  login: (data: { email: string; password: string }) =>
    request<CodeResponse>('/auth/login', { method: 'POST', body: data }),
  verify: (data: { email: string; code: string; purpose: AuthPurpose }) =>
    request<AuthResponse>('/auth/verify', { method: 'POST', body: data }),
  resend: (data: { email: string; purpose: AuthPurpose }) =>
    request<{ message: string; devCode?: string }>('/auth/resend', { method: 'POST', body: data }),
  me: () => request<{ user: AuthUser }>('/auth/me', { auth: true }),
}

// --- Reference ---
export const referenceApi = {
  airports: () => request<Airport[]>('/airports'),
  airlines: () => request<Airline[]>('/airlines'),
  airline: (code: string) => request<{ airline: Airline; flights: Flight[] }>(`/airlines/${code}`),
}

// --- Flights ---
export interface SearchParams {
  from?: string
  to?: string
  date?: string
  airline?: string
  cabinClass?: CabinClass
  sort?: 'price' | 'departure' | 'duration'
  [key: string]: string | undefined
}
export const flightsApi = {
  board: (type: 'departures' | 'arrivals') =>
    request<{ type: string; airport: Airport; flights: Flight[] }>('/flights/board', { query: { type } }),
  search: (params: SearchParams) => request<{ count: number; flights: Flight[] }>('/flights', { query: params }),
  get: (id: string) => request<Flight>(`/flights/${id}`),
}

// --- Bookings ---
export const bookingsApi = {
  create: (offerId: string, passengerName?: string) =>
    request<Booking>('/bookings', { method: 'POST', body: { offerId, passengerName }, auth: true }),
  mine: () => request<Booking[]>('/bookings', { auth: true }),
  cancel: (id: string) => request<Booking>(`/bookings/${id}/cancel`, { method: 'POST', auth: true }),
}

// --- Profile ---
export const profileApi = {
  get: () => request<Profile>('/profile', { auth: true }),
  update: (data: { firstName?: string; lastName?: string; phone?: string }) =>
    request<{ user: Profile['user'] }>('/profile', { method: 'PATCH', body: data, auth: true }),
}

// --- Info ---
export const infoApi = {
  airport: () => request<AirportInfo>('/info/airport'),
}
