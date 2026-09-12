import type { CabinClass, FlightStatus } from '@/api'

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽'
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', weekday: 'short' })
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h} ч ${m.toString().padStart(2, '0')} мин`
}

export const CABIN_LABELS: Record<CabinClass, string> = {
  ECONOMY: 'Эконом',
  BUSINESS: 'Бизнес',
  FIRST: 'Первый класс',
}

export const STATUS_LABELS: Record<FlightStatus, string> = {
  SCHEDULED: 'По расписанию',
  BOARDING: 'Посадка',
  DEPARTED: 'Вылетел',
  ARRIVED: 'Прибыл',
  DELAYED: 'Задержан',
  CANCELLED: 'Отменён',
}

export function statusBadgeClass(status: FlightStatus): string {
  switch (status) {
    case 'BOARDING':
      return 'badge-green'
    case 'DELAYED':
      return 'badge-amber'
    case 'CANCELLED':
      return 'badge-red'
    case 'DEPARTED':
    case 'ARRIVED':
      return 'badge-gray'
    default:
      return 'badge-blue'
  }
}
