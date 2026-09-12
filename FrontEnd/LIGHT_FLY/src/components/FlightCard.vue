<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { Flight } from '@/api'
import AirlineBadge from './AirlineBadge.vue'
import { formatPrice, formatTime, formatDuration, formatDateShort, STATUS_LABELS, statusBadgeClass } from '@/composables/format'

defineProps<{ flight: Flight; showStatus?: boolean }>()
</script>

<template>
  <div class="flight-card card">
    <div class="fc-airline">
      <AirlineBadge :text="flight.airline.logoText" :color="flight.airline.color" :size="44" />
      <div>
        <div class="fc-airline-name">{{ flight.airline.name }}</div>
        <div class="fc-flight-no">{{ flight.flightNumber }} · {{ flight.aircraft }}</div>
      </div>
    </div>

    <div class="fc-route">
      <div class="fc-point">
        <div class="fc-time">{{ formatTime(flight.departureTime) }}</div>
        <div class="fc-code">{{ flight.departure.code }}</div>
        <div class="fc-city">{{ flight.departure.city }}</div>
      </div>

      <div class="fc-line">
        <span class="fc-dur">{{ formatDuration(flight.durationMin) }}</span>
        <div class="fc-track"><span class="fc-plane">✈</span></div>
        <span class="fc-date">{{ formatDateShort(flight.departureTime) }}</span>
      </div>

      <div class="fc-point right">
        <div class="fc-time">{{ formatTime(flight.arrivalTime) }}</div>
        <div class="fc-code">{{ flight.arrival.code }}</div>
        <div class="fc-city">{{ flight.arrival.city }}</div>
      </div>
    </div>

    <div class="fc-action">
      <div v-if="showStatus" class="badge" :class="statusBadgeClass(flight.status)">
        {{ STATUS_LABELS[flight.status] }}
      </div>
      <template v-else>
        <div class="fc-price-label">от</div>
        <div class="fc-price">{{ formatPrice(flight.minPrice) }}</div>
        <RouterLink :to="`/flights/${flight.id}`" class="btn btn-primary btn-sm">Выбрать</RouterLink>
      </template>
    </div>
  </div>
</template>

<style scoped>
.flight-card {
  display: grid;
  grid-template-columns: 1.3fr 2fr 1fr;
  align-items: center;
  gap: 20px;
  padding: 18px 22px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.flight-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}
.fc-airline {
  display: flex;
  align-items: center;
  gap: 12px;
}
.fc-airline-name {
  font-weight: 700;
  font-size: 15px;
}
.fc-flight-no {
  font-size: 12.5px;
  color: var(--muted);
}
.fc-route {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  align-items: center;
  gap: 8px;
}
.fc-point .fc-time {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.fc-point .fc-code {
  font-size: 13px;
  font-weight: 700;
  color: var(--blue-600);
}
.fc-point .fc-city {
  font-size: 12.5px;
  color: var(--muted);
}
.fc-point.right {
  text-align: right;
}
.fc-line {
  text-align: center;
}
.fc-dur,
.fc-date {
  display: block;
  font-size: 11.5px;
  color: var(--muted);
}
.fc-track {
  position: relative;
  height: 2px;
  background: linear-gradient(90deg, var(--line), var(--blue-400), var(--line));
  margin: 6px 0;
  border-radius: 2px;
}
.fc-plane {
  position: absolute;
  right: -2px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: var(--blue-500);
}
.fc-action {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.fc-price-label {
  font-size: 12px;
  color: var(--muted);
}
.fc-price {
  font-size: 21px;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.02em;
}
@media (max-width: 820px) {
  .flight-card {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .fc-action {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--line-soft);
    padding-top: 12px;
  }
}
</style>
