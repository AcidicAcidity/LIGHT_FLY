<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { profileApi, bookingsApi, ApiError, type Profile, type Booking } from '@/api'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/api'
import {
  formatPrice,
  formatTime,
  formatDate,
  CABIN_LABELS,
} from '@/composables/format'

function roleLabel(role: Role): string {
  return { USER: 'Пользователь', MANAGER: 'Сотрудник', ADMIN: 'Администратор' }[role]
}

const auth = useAuthStore()
const { user } = storeToRefs(auth)

const profile = ref<Profile | null>(null)
const bookings = ref<Booking[]>([])
const loading = ref(true)
const tab = ref<'bookings' | 'loyalty' | 'profile'>('bookings')

// профиль-редактирование
const edit = ref({ firstName: '', lastName: '', phone: '' })
const editMsg = ref('')
const savingProfile = ref(false)

const activeBookings = computed(() => bookings.value.filter((b) => b.status !== 'CANCELLED'))

async function load() {
  loading.value = true
  try {
    const [p, b] = await Promise.all([profileApi.get(), bookingsApi.mine()])
    profile.value = p
    bookings.value = b
    edit.value = { firstName: p.user.firstName, lastName: p.user.lastName, phone: p.user.phone ?? '' }
  } finally {
    loading.value = false
  }
}

async function cancel(id: string) {
  try {
    await bookingsApi.cancel(id)
    await load()
    await auth.refresh()
  } catch (e) {
    alert(e instanceof ApiError ? e.message : 'Не удалось отменить бронь')
  }
}

async function saveProfile() {
  savingProfile.value = true
  editMsg.value = ''
  try {
    await auth.updateProfile(edit.value)
    await load()
    editMsg.value = 'Профиль обновлён.'
  } catch (e) {
    editMsg.value = e instanceof ApiError ? e.message : 'Ошибка сохранения'
  } finally {
    savingProfile.value = false
  }
}

function tierProgress(): number {
  const l = profile.value?.loyalty
  if (!l || !l.next) return 100
  const prevMin = l.allTiers.find((t) => t.tier === l.tier)?.minSpent ?? 0
  const span = l.next.minSpent - prevMin
  return Math.min(100, Math.round(((l.totalSpent - prevMin) / span) * 100))
}

onMounted(load)
</script>

<template>
  <div class="page container">
    <div v-if="loading" class="spinner"></div>

    <template v-else-if="profile">
      <!-- Header card -->
      <div class="acc-header card">
        <div class="acc-id">
          <span class="acc-avatar">{{ user?.firstName?.[0] }}{{ user?.lastName?.[0] }}</span>
          <div>
            <h1>{{ profile.user.firstName }} {{ profile.user.lastName }}</h1>
            <p class="muted">{{ profile.user.email }}</p>
          </div>
        </div>
        <div class="acc-tier" :class="'tier-' + profile.loyalty.tier.toLowerCase()">
          <span class="acc-tier-label">Уровень</span>
          <span class="acc-tier-name">{{ profile.loyalty.tierLabel }}</span>
          <span class="acc-tier-disc">скидка {{ profile.loyalty.discountPct }}%</span>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpis">
        <div class="kpi card">
          <span class="kpi-value">{{ profile.stats.bookingsCount }}</span>
          <span class="kpi-label">Активных билетов</span>
        </div>
        <div class="kpi card">
          <span class="kpi-value">{{ profile.loyalty.bonusMiles }}</span>
          <span class="kpi-label">Бонусных миль</span>
        </div>
        <div class="kpi card">
          <span class="kpi-value">{{ formatPrice(profile.loyalty.totalSpent) }}</span>
          <span class="kpi-label">Сумма покупок</span>
        </div>
        <div class="kpi card">
          <span class="kpi-value">{{ profile.loyalty.discountPct }}%</span>
          <span class="kpi-label">Ваша скидка</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button :class="{ active: tab === 'bookings' }" @click="tab = 'bookings'">Мои билеты</button>
        <button :class="{ active: tab === 'loyalty' }" @click="tab = 'loyalty'">Программа лояльности</button>
        <button :class="{ active: tab === 'profile' }" @click="tab = 'profile'">Профиль</button>
      </div>

      <!-- BOOKINGS -->
      <div v-if="tab === 'bookings'" class="tab-body">
        <div v-if="!bookings.length" class="empty card">
          <div class="empty-ico">🎫</div>
          <h3>Билетов пока нет</h3>
          <p class="muted">Найдите подходящий рейс в маркете и оформите первый билет.</p>
          <RouterLink to="/market" class="btn btn-primary">Купить билет</RouterLink>
        </div>

        <div v-else class="bookings">
          <div v-for="b in bookings" :key="b.id" class="ticket card" :class="{ cancelled: b.status === 'CANCELLED' }">
            <div class="ticket-main">
              <div class="ticket-route" v-if="b.flight">
                <div class="tr-point">
                  <b>{{ formatTime(b.flight.departureTime) }}</b>
                  <span>{{ b.flight.departure.code }}</span>
                </div>
                <div class="tr-arrow">✈</div>
                <div class="tr-point">
                  <b>{{ formatTime(b.flight.arrivalTime) }}</b>
                  <span>{{ b.flight.arrival.code }}</span>
                </div>
              </div>
              <div class="ticket-info">
                <div class="ti-cities" v-if="b.flight">
                  {{ b.flight.departure.city }} → {{ b.flight.arrival.city }}
                </div>
                <div class="muted small" v-if="b.flight">
                  {{ formatDate(b.flight.departureTime) }} · {{ b.flight.airline.name }} · {{ b.flight.flightNumber }}
                </div>
                <div class="ti-tags">
                  <span class="badge badge-blue">{{ CABIN_LABELS[b.cabinClass] }}</span>
                  <span class="badge badge-gray">Место {{ b.seat }}</span>
                  <span class="badge" :class="b.status === 'CANCELLED' ? 'badge-red' : 'badge-green'">
                    {{ b.status === 'CANCELLED' ? 'Отменён' : 'Оплачен' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="ticket-side">
              <div class="ticket-ref">№ {{ b.bookingRef }}</div>
              <div class="ticket-price">{{ formatPrice(b.pricePaid) }}</div>
              <div v-if="b.discountPct" class="muted small">скидка {{ b.discountPct }}%</div>
              <button
                v-if="b.status !== 'CANCELLED'"
                class="btn btn-ghost btn-sm cancel-btn"
                @click="cancel(b.id)"
              >
                Отменить
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- LOYALTY -->
      <div v-else-if="tab === 'loyalty'" class="tab-body">
        <div class="card loyalty">
          <h3>Скидочная программа LIGHT FLY</h3>
          <p class="muted">Чем больше вы летаете, тем выше уровень и больше скидка на каждый билет.</p>

          <div class="progress-block" v-if="profile.loyalty.next">
            <div class="progress-head">
              <span>{{ profile.loyalty.tierLabel }}</span>
              <span>{{ profile.loyalty.next.label }}</span>
            </div>
            <div class="progress"><div class="progress-fill" :style="{ width: tierProgress() + '%' }"></div></div>
            <p class="muted small">
              До уровня «{{ profile.loyalty.next.label }}» осталось потратить
              <b>{{ formatPrice(profile.loyalty.next.remaining) }}</b>
              (скидка вырастет до {{ profile.loyalty.next.discountPct }}%)
            </p>
          </div>
          <div v-else class="alert alert-success">Поздравляем! У вас максимальный уровень программы.</div>

          <div class="tiers">
            <div
              v-for="t in profile.loyalty.allTiers"
              :key="t.tier"
              class="tier-row"
              :class="{ current: t.tier === profile.loyalty.tier }"
            >
              <span class="tier-name">{{ t.label }}</span>
              <span class="muted">от {{ formatPrice(t.minSpent) }}</span>
              <span class="tier-disc">−{{ t.discountPct }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- PROFILE -->
      <div v-else class="tab-body">
        <div class="card profile-edit">
          <h3>Личные данные</h3>
          <p v-if="editMsg" class="alert alert-success">{{ editMsg }}</p>
          <div class="row">
            <div class="field"><label>Имя</label><input v-model="edit.firstName" class="input" /></div>
            <div class="field"><label>Фамилия</label><input v-model="edit.lastName" class="input" /></div>
          </div>
          <div class="field"><label>Телефон</label><input v-model="edit.phone" class="input" /></div>
          <div class="field">
            <label>Email</label>
            <input :value="profile.user.email" class="input" disabled />
          </div>
          <div class="field">
            <label>Роль в системе</label>
            <input :value="roleLabel(profile.user.role)" class="input" disabled />
          </div>
          <button class="btn btn-primary" :disabled="savingProfile" @click="saveProfile">
            {{ savingProfile ? 'Сохраняем…' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  padding-block: 40px 72px;
}
.acc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 26px;
  flex-wrap: wrap;
}
.acc-id {
  display: flex;
  align-items: center;
  gap: 16px;
}
.acc-avatar {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--blue-500), var(--sky-400));
  color: #fff;
  font-size: 22px;
  font-weight: 800;
}
.acc-header h1 {
  font-size: 26px;
}
.acc-tier {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 12px 20px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, #334155, #0f172a);
  color: #fff;
}
.tier-silver {
  background: linear-gradient(135deg, #94a3b8, #475569);
}
.tier-gold {
  background: linear-gradient(135deg, #f59e0b, #b45309);
}
.tier-platinum {
  background: linear-gradient(135deg, #38bdf8, #1d4ed8);
}
.acc-tier-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.8;
}
.acc-tier-name {
  font-size: 20px;
  font-weight: 800;
}
.acc-tier-disc {
  font-size: 13px;
  opacity: 0.9;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 18px 0;
}
.kpi {
  padding: 20px;
  text-align: center;
}
.kpi-value {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: var(--blue-600);
}
.kpi-label {
  font-size: 13px;
  color: var(--muted);
}

.tabs {
  display: inline-flex;
  gap: 4px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px;
  margin-bottom: 20px;
}
.tabs button {
  border: none;
  background: transparent;
  padding: 9px 20px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 14px;
  color: var(--ink-soft);
}
.tabs button.active {
  background: var(--surface);
  color: var(--blue-600);
  box-shadow: var(--shadow-sm);
}
.small {
  font-size: 12.5px;
}

.bookings {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ticket {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
}
.ticket.cancelled {
  opacity: 0.6;
}
.ticket-main {
  display: flex;
  gap: 24px;
  align-items: center;
  flex: 1;
}
.ticket-route {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tr-point {
  text-align: center;
}
.tr-point b {
  display: block;
  font-size: 18px;
}
.tr-point span {
  font-size: 12px;
  color: var(--blue-600);
  font-weight: 700;
}
.tr-arrow {
  color: var(--blue-500);
}
.ti-cities {
  font-weight: 700;
  font-size: 16px;
}
.ti-tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.ticket-side {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  border-left: 1px dashed var(--line);
  padding-left: 20px;
}
.ticket-ref {
  font-size: 12px;
  color: var(--muted);
}
.ticket-price {
  font-size: 20px;
  font-weight: 800;
}
.cancel-btn {
  margin-top: 6px;
}

.empty {
  text-align: center;
  padding: 56px 24px;
}
.empty-ico {
  font-size: 40px;
  margin-bottom: 8px;
}
.empty h3 {
  margin-bottom: 6px;
}
.empty .btn {
  margin-top: 16px;
}

.loyalty,
.profile-edit {
  padding: 28px;
}
.loyalty h3,
.profile-edit h3 {
  margin-bottom: 8px;
}
.progress-block {
  margin: 24px 0;
}
.progress-head {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
}
.progress {
  height: 10px;
  border-radius: 999px;
  background: var(--line);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--blue-500), var(--sky-400));
  border-radius: 999px;
  transition: width 0.4s ease;
}
.tiers {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tier-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  font-size: 14px;
}
.tier-row.current {
  border-color: var(--blue-400);
  background: #eff6ff;
}
.tier-name {
  font-weight: 700;
}
.tier-disc {
  font-weight: 800;
  color: var(--blue-600);
}

.profile-edit .row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 800px) {
  .kpis {
    grid-template-columns: 1fr 1fr;
  }
  .ticket {
    flex-direction: column;
  }
  .ticket-side {
    border-left: none;
    border-top: 1px dashed var(--line);
    padding-left: 0;
    padding-top: 14px;
    align-items: stretch;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .ticket-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .profile-edit .row {
    grid-template-columns: 1fr;
  }
}
</style>
