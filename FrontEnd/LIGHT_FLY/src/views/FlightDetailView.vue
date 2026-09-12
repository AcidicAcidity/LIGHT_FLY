<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { flightsApi, bookingsApi, ApiError, type Flight, type Offer, type Booking } from '@/api'
import { useAuthStore } from '@/stores/auth'
import AirlineBadge from '@/components/AirlineBadge.vue'
import {
  formatPrice,
  formatTime,
  formatDate,
  formatDuration,
  CABIN_LABELS,
  STATUS_LABELS,
  statusBadgeClass,
} from '@/composables/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { isAuthenticated, user } = storeToRefs(auth)

const flight = ref<Flight | null>(null)
const loading = ref(true)
const selected = ref<Offer | null>(null)
const booking = ref<Booking | null>(null)
const error = ref('')
const submitting = ref(false)

onMounted(async () => {
  try {
    flight.value = await flightsApi.get(route.params.id as string)
    selected.value = flight.value.offers[0] ?? null
  } catch {
    error.value = 'Не удалось загрузить рейс.'
  } finally {
    loading.value = false
  }
})

function priceWithDiscount(price: number): number {
  const pct = user.value?.discountPct ?? 0
  return Math.round(price * (1 - pct / 100))
}

async function book() {
  if (!selected.value) return
  if (!isAuthenticated.value) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  submitting.value = true
  error.value = ''
  try {
    booking.value = await bookingsApi.create(selected.value.id)
    await auth.refresh()
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Не удалось оформить билет.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page container">
    <div v-if="loading" class="spinner"></div>

    <template v-else-if="flight">
      <RouterLink to="/market" class="back">← К поиску билетов</RouterLink>

      <!-- Booking success -->
      <div v-if="booking" class="success card">
        <div class="success-ico">✓</div>
        <h2>Билет оформлен!</h2>
        <p class="muted">Номер брони <b>{{ booking.bookingRef }}</b> · место {{ booking.seat }}</p>
        <div class="success-row">
          <span>{{ flight.departure.city }} → {{ flight.arrival.city }}</span>
          <span>{{ CABIN_LABELS[booking.cabinClass] }}</span>
          <span><b>{{ formatPrice(booking.pricePaid) }}</b></span>
        </div>
        <p v-if="booking.discountPct" class="muted small">
          Применена скидка {{ booking.discountPct }}% · начислено {{ booking.milesEarned }} миль
        </p>
        <div class="success-actions">
          <RouterLink to="/account" class="btn btn-primary">Мои билеты</RouterLink>
          <RouterLink to="/market" class="btn btn-ghost">Купить ещё</RouterLink>
        </div>
      </div>

      <!-- Flight + offers -->
      <div v-else class="detail-grid">
        <div class="detail-main card">
          <div class="detail-airline">
            <AirlineBadge :text="flight.airline.logoText" :color="flight.airline.color" :size="48" />
            <div>
              <div class="da-name">{{ flight.airline.name }}</div>
              <div class="muted small">{{ flight.flightNumber }} · {{ flight.aircraft }}</div>
            </div>
            <span class="badge" :class="statusBadgeClass(flight.status)">{{ STATUS_LABELS[flight.status] }}</span>
          </div>

          <div class="detail-route">
            <div class="dr-point">
              <div class="dr-time">{{ formatTime(flight.departureTime) }}</div>
              <div class="dr-code">{{ flight.departure.code }}</div>
              <div class="muted small">{{ flight.departure.city }}</div>
            </div>
            <div class="dr-mid">
              <span class="muted small">{{ formatDuration(flight.durationMin) }}</span>
              <div class="dr-track"><span>✈</span></div>
              <span class="muted small">{{ formatDate(flight.departureTime) }}</span>
            </div>
            <div class="dr-point right">
              <div class="dr-time">{{ formatTime(flight.arrivalTime) }}</div>
              <div class="dr-code">{{ flight.arrival.code }}</div>
              <div class="muted small">{{ flight.arrival.city }}</div>
            </div>
          </div>

          <div class="detail-meta">
            <div><span class="muted small">Терминал</span><b>{{ flight.terminal ?? '—' }}</b></div>
            <div><span class="muted small">Выход</span><b>{{ flight.gate ?? '—' }}</b></div>
            <div><span class="muted small">Самолёт</span><b>{{ flight.aircraft }}</b></div>
          </div>

          <h3 class="offers-title">Выберите тариф</h3>
          <div class="offers">
            <button
              v-for="o in flight.offers"
              :key="o.id"
              class="offer"
              :class="{ active: selected?.id === o.id, out: o.seatsAvailable === 0 }"
              :disabled="o.seatsAvailable === 0"
              @click="selected = o"
            >
              <div class="offer-top">
                <span class="offer-class">{{ CABIN_LABELS[o.cabinClass] }}</span>
                <span class="offer-price">{{ formatPrice(o.price) }}</span>
              </div>
              <ul class="offer-feats">
                <li>🧳 Багаж {{ o.baggageKg }} кг</li>
                <li>{{ o.refundable ? '↩ Возвратный' : '✕ Невозвратный' }}</li>
                <li>{{ o.seatsAvailable > 0 ? `Мест: ${o.seatsAvailable}` : 'Нет мест' }}</li>
              </ul>
            </button>
          </div>
        </div>

        <!-- Sidebar / checkout -->
        <aside class="checkout card">
          <h3>Ваш билет</h3>
          <div class="co-row">
            <span class="muted">Направление</span>
            <span>{{ flight.departure.code }} → {{ flight.arrival.code }}</span>
          </div>
          <div class="co-row">
            <span class="muted">Тариф</span>
            <span>{{ selected ? CABIN_LABELS[selected.cabinClass] : '—' }}</span>
          </div>
          <div class="co-row">
            <span class="muted">Цена</span>
            <span>{{ selected ? formatPrice(selected.price) : '—' }}</span>
          </div>
          <div class="co-row" v-if="isAuthenticated && user && user.discountPct > 0 && selected">
            <span class="muted">Скидка {{ user.tierLabel }} ({{ user.discountPct }}%)</span>
            <span class="disc">−{{ formatPrice(selected.price - priceWithDiscount(selected.price)) }}</span>
          </div>
          <div class="co-total">
            <span>Итого</span>
            <b>{{ selected ? formatPrice(isAuthenticated ? priceWithDiscount(selected.price) : selected.price) : '—' }}</b>
          </div>

          <p v-if="error" class="alert alert-error">{{ error }}</p>

          <button class="btn btn-accent btn-block" :disabled="!selected || submitting" @click="book">
            {{ submitting ? 'Оформляем…' : isAuthenticated ? 'Купить билет' : 'Войти и купить' }}
          </button>
          <p v-if="!isAuthenticated" class="muted small login-hint">
            Для покупки нужен аккаунт. Зарегистрируйтесь и получите скидку по программе лояльности.
          </p>
        </aside>
      </div>
    </template>

    <div v-else class="alert alert-error">{{ error || 'Рейс не найден.' }}</div>
  </div>
</template>

<style scoped>
.page {
  padding-block: 32px 72px;
}
.back {
  display: inline-block;
  margin-bottom: 18px;
  color: var(--blue-600);
  font-weight: 600;
  font-size: 14px;
}
.small {
  font-size: 12.5px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 22px;
  align-items: start;
}
.detail-main {
  padding: 26px;
}
.detail-airline {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line-soft);
}
.da-name {
  font-weight: 700;
  font-size: 17px;
}
.detail-airline .badge {
  margin-left: auto;
}
.detail-route {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  align-items: center;
  padding: 26px 0;
}
.dr-time {
  font-size: 30px;
  font-weight: 800;
}
.dr-code {
  font-weight: 700;
  color: var(--blue-600);
}
.dr-point.right {
  text-align: right;
}
.dr-mid {
  text-align: center;
}
.dr-track {
  position: relative;
  height: 2px;
  background: linear-gradient(90deg, var(--line), var(--blue-400), var(--line));
  margin: 8px 0;
}
.dr-track span {
  position: absolute;
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--blue-500);
}
.detail-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 18px 0;
  border-top: 1px solid var(--line-soft);
  border-bottom: 1px solid var(--line-soft);
}
.detail-meta div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.offers-title {
  margin: 22px 0 14px;
  font-size: 17px;
}
.offers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.offer {
  text-align: left;
  border: 2px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: 14px 16px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.offer:hover:not(:disabled) {
  border-color: var(--blue-400);
}
.offer.active {
  border-color: var(--blue-500);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.offer.out {
  opacity: 0.5;
  cursor: not-allowed;
}
.offer-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}
.offer-class {
  font-weight: 700;
}
.offer-price {
  font-weight: 800;
  color: var(--blue-600);
}
.offer-feats {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 12.5px;
  color: var(--muted);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.checkout {
  padding: 22px;
  position: sticky;
  top: 88px;
}
.checkout h3 {
  margin-bottom: 16px;
}
.co-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 7px 0;
}
.disc {
  color: var(--success);
  font-weight: 600;
}
.co-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0 18px;
  padding-top: 14px;
  border-top: 1px solid var(--line-soft);
  font-size: 15px;
}
.co-total b {
  font-size: 24px;
  color: var(--ink);
}
.login-hint {
  margin-top: 12px;
  text-align: center;
}

.success {
  max-width: 520px;
  margin: 20px auto;
  padding: 40px;
  text-align: center;
}
.success-ico {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #dcfce7;
  color: var(--success);
  font-size: 32px;
  display: grid;
  place-items: center;
  margin: 0 auto 16px;
}
.success-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  padding: 14px 18px;
  margin: 20px 0 8px;
  font-size: 15px;
}
.success-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 22px;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .checkout {
    position: static;
  }
}
</style>
