<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { referenceApi, type Airline, type Flight } from '@/api'
import AirlineBadge from '@/components/AirlineBadge.vue'
import FlightCard from '@/components/FlightCard.vue'

const route = useRoute()
const airline = ref<Airline | null>(null)
const flights = ref<Flight[]>([])
const loading = ref(true)
const notFound = ref(false)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    const res = await referenceApi.airline(route.params.code as string)
    airline.value = res.airline
    flights.value = res.flights
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.code, load)
</script>

<template>
  <div class="page">
    <div v-if="loading" class="container"><div class="spinner"></div></div>

    <div v-else-if="notFound" class="container">
      <div class="alert alert-error">Авиакомпания не найдена.</div>
      <RouterLink to="/airlines" class="btn btn-ghost">← Все авиакомпании</RouterLink>
    </div>

    <template v-else-if="airline">
      <section class="al-hero" :style="{ background: `linear-gradient(135deg, ${airline.color}, #0a1b3d)` }">
        <div class="container al-hero-inner">
          <AirlineBadge :text="airline.logoText" :color="'rgba(255,255,255,0.18)'" :size="70" />
          <div>
            <h1>{{ airline.name }}</h1>
            <p>{{ airline.description }}</p>
            <div class="al-tags">
              <span class="badge badge-gray">Код {{ airline.code }}</span>
              <span class="badge badge-gray">{{ airline.country }}</span>
              <span class="badge badge-gray">{{ flights.length }} ближайших рейсов</span>
            </div>
          </div>
        </div>
      </section>

      <div class="container al-body">
        <RouterLink to="/airlines" class="back">← Все авиакомпании</RouterLink>
        <h2>Ближайшие рейсы {{ airline.name }}</h2>
        <div class="al-flights">
          <FlightCard v-for="f in flights" :key="f.id" :flight="f" />
          <p v-if="!flights.length" class="muted">Нет предстоящих рейсов.</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  padding-bottom: 72px;
}
.al-hero {
  color: #fff;
  padding: 54px 0;
}
.al-hero-inner {
  display: flex;
  align-items: center;
  gap: 24px;
}
.al-hero h1 {
  font-size: clamp(26px, 5vw, 40px);
}
.al-hero p {
  color: rgba(255, 255, 255, 0.85);
  max-width: 640px;
  margin: 10px 0 14px;
}
.al-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.al-tags .badge {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}
.al-body {
  padding-top: 28px;
}
.back {
  display: inline-block;
  color: var(--blue-600);
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 16px;
}
.al-body h2 {
  font-size: 22px;
  margin-bottom: 18px;
}
.al-flights {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
@media (max-width: 640px) {
  .al-hero-inner {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }
}
</style>
