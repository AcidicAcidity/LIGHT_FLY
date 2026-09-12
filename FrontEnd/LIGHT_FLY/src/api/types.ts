// Типы данных, приходящих с бэкенда LIGHT_FLY API

export type Role = 'USER' | 'MANAGER' | 'ADMIN'
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
export type CabinClass = 'ECONOMY' | 'BUSINESS' | 'FIRST'
export type FlightStatus = 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'DELAYED' | 'CANCELLED'
export type BookingStatus = 'BOOKED' | 'PAID' | 'CANCELLED'
export type AuthPurpose = 'REGISTER' | 'LOGIN'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: Role
  tier: LoyaltyTier
  tierLabel: string
  discountPct: number
  bonusMiles: number
  totalSpent: number
  nextTier: { tier: LoyaltyTier; label: string; minSpent: number } | null
  isEmailVerified: boolean
}

export interface Airport {
  id: string
  code: string
  name: string
  city: string
  country: string
  isHome: boolean
}

export interface Airline {
  id: string
  code: string
  name: string
  country: string
  logoText: string
  color: string
  description: string
  flightsCount?: number
}

export interface Offer {
  id: string
  cabinClass: CabinClass
  price: number
  seatsAvailable: number
  baggageKg: number
  refundable: boolean
}

export interface Flight {
  id: string
  flightNumber: string
  airline: { code: string; name: string; logoText: string; color: string }
  departure: { code: string; city: string; name: string }
  arrival: { code: string; city: string; name: string }
  departureTime: string
  arrivalTime: string
  durationMin: number
  aircraft: string
  terminal: string | null
  gate: string | null
  status: FlightStatus
  minPrice: number | null
  offers: Offer[]
}

export interface Booking {
  id: string
  bookingRef: string
  passengerName: string
  seat: string | null
  status: BookingStatus
  cabinClass: CabinClass
  basePrice: number
  discountPct: number
  pricePaid: number
  milesEarned: number
  createdAt: string
  flight?: Flight
}

export interface Profile {
  user: { id: string; email: string; firstName: string; lastName: string; phone: string | null; role: Role }
  loyalty: {
    tier: LoyaltyTier
    tierLabel: string
    discountPct: number
    bonusMiles: number
    totalSpent: number
    next: { tier: LoyaltyTier; label: string; discountPct: number; minSpent: number; remaining: number } | null
    allTiers: { tier: LoyaltyTier; minSpent: number; discountPct: number; label: string }[]
  }
  stats: { bookingsCount: number }
}

export interface AirportInfo {
  name: string
  code: string
  city: string
  tagline: string
  about: string
  stats: { label: string; value: string }[]
  terminals: { name: string; description: string }[]
  services: { icon: string; title: string; description: string }[]
  contacts: { phone: string; email: string; address: string; hours: string }
  faq: { q: string; a: string }[]
}
