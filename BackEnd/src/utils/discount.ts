import type { LoyaltyTier } from '../db/schema.js'

// Пороги скидочной программы по сумме покупок (руб.) и процент скидки.
export const TIERS: { tier: LoyaltyTier; minSpent: number; discountPct: number; label: string }[] = [
  { tier: 'BRONZE', minSpent: 0, discountPct: 0, label: 'Бронза' },
  { tier: 'SILVER', minSpent: 30000, discountPct: 5, label: 'Серебро' },
  { tier: 'GOLD', minSpent: 100000, discountPct: 10, label: 'Золото' },
  { tier: 'PLATINUM', minSpent: 250000, discountPct: 15, label: 'Платина' },
]

export function tierForSpent(totalSpent: number): LoyaltyTier {
  let result: LoyaltyTier = 'BRONZE'
  for (const t of TIERS) {
    if (totalSpent >= t.minSpent) result = t.tier
  }
  return result
}

export function discountForTier(tier: LoyaltyTier): number {
  return TIERS.find((t) => t.tier === tier)?.discountPct ?? 0
}

export function tierInfo(tier: LoyaltyTier) {
  const idx = TIERS.findIndex((t) => t.tier === tier)
  const current = TIERS[idx]!
  const next = TIERS[idx + 1] ?? null
  return { current, next }
}
