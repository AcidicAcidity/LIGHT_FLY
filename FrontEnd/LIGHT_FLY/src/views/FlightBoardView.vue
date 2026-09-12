<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { flightsApi, type Flight } from '@/api'
import AirlineBadge from '@/components/AirlineBadge.vue'
import { formatTime, formatDateShort, STATUS_LABELS, statusBadgeClass } from '@/composables/format'

const tab = ref<'departures' | 'arrivals'>('departures')
const flights = ref<Flight[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const { flights: f } = await flightsApi.board(tab.value)
    flights.value = f
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(tab, load)
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="page-head">
        <h1>Онлайн-табло</h1>
        <p class="muted">Актуальное расписание вылетов и прилётов аэропорта LIGHT FLY (LFL).</p>
      </div>

      <div class="tabs">
        <button :class="{ active: tab === 'departures' }" @click="tab = 'departures'">🛫 Вылет</button>
        <button :class="{ active: tab === 'arrivals' }" @click="tab = 'arrivals'">🛬 Прилёт</button>
      </div>

      <div v-if="loading" class="spinner"></div>

      <div v-else class="board card">
        <div class="board-row board-head">
          <span>Рейс</span>
          <span>{{ tab === 'departures' ? 'Назначение' : 'Откуда' }}</span>
          <span>Время</span>
          <span>Терминал / Выход</span>
          <span>Статус</span>
        </div>
        <RouterLink
          v-for="f in flights"
          :key="f.id"
          :to="`/flights/${f.id}`"
          class="board-row"
        >
          <span class="cell-flight">
            <AirlineBadge :text="f.airline.logoText" :color="f.airline.color" :size="30" />
            <b>{{ f.flightNumber }}</b>
          </span>
          <span class="cell-dest">
            <b>{{ tab === 'departures' ? f.arrival.city : f.departure.city }}</b>
            <small class="muted">{{ tab === 'departures' ? f.arrival.code : f.departure.code }} · {{ f.airline.name }}</small>
          </span>
          <span class="cell-time">
            <b>{{ formatTime(tab === 'departures' ? f.departureTime : f.arrivalTime) }}</b>
            <small class="muted">{{ formatDateShort(f.departureTime) }}</small>
          </span>
          <span class="cell-gate">{{ f.terminal ? 'Терминал ' + f.terminal : '—' }} · {{ f.gate ?? '—' }}</span>
          <span><span class="badge" :class="statusBadgeClass(f.status)">{{ STATUS_LABELS[f.status] }}</span></span>
        </RouterLink>

        <div v-if="!flights.length" class="empty muted">Рейсы не найдены.</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding-block: 44px 72px;
}
.page-head {
  margin-bottom: 24px;
}
.page-head h1 {
  font-size: clamp(28px, 5vw, 40px);
}
.tabs {
  display: inline-flex;
  gap: 4px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px;
  margin-bottom: 22px;
}
.tabs button {
  border: none;
  background: transparent;
  padding: 9px 22px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 15px;
  color: var(--ink-soft);
}
.tabs button.active {
  background: var(--surface);
  color: var(--blue-600);
  box-shadow: var(--shadow-sm);
}
.board {
  overflow: hidden;
}
.board-row {
  display: grid;
  grid-template-columns: 1.1fr 1.6fr 1fr 1.3fr 1.1fr;
  align-items: center;
  gap: 14px;
  padding: 14px 22px;
  border-bottom: 1px solid var(--line-soft);
  transition: background 0.12s ease;
}
.board-row:last-child {
  border-bottom: none;
}
a.board-row:hover {
  background: var(--surface-2);
}
.board-head {
  background: var(--surface-2);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
}
.cell-flight {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cell-dest,
.cell-time {
  display: flex;
  flex-direction: column;
}
.cell-dest small,
.cell-time small {
  font-size: 12px;
}
.cell-gate {
  font-size: 14px;
  color: var(--ink-soft);
}
.empty {
  padding: 40px;
  text-align: center;
}
@media (max-width: 800px) {
  .board-head {
    display: none;
  }
  .board-row {
    grid-template-columns: 1fr 1fr;
    row-gap: 6px;
  }
  .cell-gate {
    display: none;
  }
}
</style>
