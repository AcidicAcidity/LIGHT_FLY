<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { flightsApi, type Flight, type CabinClass } from '@/api'
import SearchForm from '@/components/SearchForm.vue'
import FlightCard from '@/components/FlightCard.vue'

const route = useRoute()
const flights = ref<Flight[]>([])
const loading = ref(false)
const searched = ref(false)
const sort = ref<'price' | 'departure' | 'duration'>('price')

const initial = computed(() => ({
  from: (route.query.from as string) ?? 'LFL',
  to: (route.query.to as string) ?? '',
  date: (route.query.date as string) ?? '',
  cabinClass: (route.query.cabinClass as string) ?? '',
}))

async function search() {
  loading.value = true
  searched.value = true
  try {
    const res = await flightsApi.search({
      from: (route.query.from as string) || undefined,
      to: (route.query.to as string) || undefined,
      date: (route.query.date as string) || undefined,
      cabinClass: (route.query.cabinClass as CabinClass) || undefined,
      sort: sort.value,
    })
    flights.value = res.flights
  } finally {
    loading.value = false
  }
}

onMounted(search)
watch(() => route.query, search)
watch(sort, search)
</script>

<template>
  <div class="page">
    <div class="market-hero">
      <div class="container">
        <h1>Маркет авиабилетов</h1>
        <p class="muted">Сравните предложения авиакомпаний и купите билет в пару кликов.</p>
        <div class="market-search">
          <SearchForm :initial="initial" />
        </div>
      </div>
    </div>

    <div class="container results">
      <div class="results-bar" v-if="searched">
        <span class="muted">
          <template v-if="loading">Ищем рейсы…</template>
          <template v-else>Найдено рейсов: <b>{{ flights.length }}</b></template>
        </span>
        <label class="sort">
          Сортировка:
          <select v-model="sort" class="select sort-select">
            <option value="price">по цене</option>
            <option value="departure">по времени вылета</option>
            <option value="duration">по длительности</option>
          </select>
        </label>
      </div>

      <div v-if="loading" class="spinner"></div>

      <div v-else class="results-list">
        <FlightCard v-for="f in flights" :key="f.id" :flight="f" />
        <div v-if="searched && !flights.length" class="empty card">
          <div class="empty-ico">🔎</div>
          <h3>Ничего не найдено</h3>
          <p class="muted">Попробуйте изменить направление или дату поиска.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.market-hero {
  background: linear-gradient(160deg, var(--navy-900), var(--navy-700));
  color: #fff;
  padding: 44px 0 80px;
}
.market-hero h1 {
  font-size: clamp(26px, 4vw, 36px);
}
.market-hero p {
  color: #cbd5e1 !important;
  margin: 6px 0 28px;
}
.market-search {
  max-width: 1050px;
}
.results {
  margin-top: -44px;
  padding-bottom: 72px;
  position: relative;
  z-index: 2;
}
.results-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 12px 18px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}
.sort {
  font-size: 14px;
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.sort-select {
  width: auto;
  padding: 7px 12px;
}
.results-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.empty {
  text-align: center;
  padding: 56px 24px;
}
.empty-ico {
  font-size: 40px;
  margin-bottom: 10px;
}
@media (max-width: 520px) {
  .results-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
