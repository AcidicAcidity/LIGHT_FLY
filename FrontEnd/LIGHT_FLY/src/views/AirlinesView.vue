<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { referenceApi, type Airline } from '@/api'
import AirlineBadge from '@/components/AirlineBadge.vue'

const airlines = ref<Airline[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    airlines.value = await referenceApi.airlines()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page container">
    <div class="page-head">
      <h1>Авиакомпании</h1>
      <p class="muted">Перевозчики, выполняющие рейсы из аэропорта LIGHT FLY. Откройте страницу компании, чтобы найти её предложения.</p>
    </div>

    <div v-if="loading" class="spinner"></div>

    <div v-else class="airlines-grid">
      <RouterLink v-for="a in airlines" :key="a.code" :to="`/airlines/${a.code}`" class="airline-card card">
        <div class="ac-top">
          <AirlineBadge :text="a.logoText" :color="a.color" :size="52" />
          <div>
            <div class="ac-name">{{ a.name }}</div>
            <div class="muted small">{{ a.country }} · код {{ a.code }}</div>
          </div>
        </div>
        <p class="ac-desc muted">{{ a.description }}</p>
        <div class="ac-foot">
          <span class="badge badge-blue">{{ a.flightsCount ?? 0 }} рейсов</span>
          <span class="ac-link">Смотреть рейсы →</span>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding-block: 44px 72px;
}
.page-head {
  margin-bottom: 28px;
  max-width: 640px;
}
.page-head h1 {
  font-size: clamp(28px, 5vw, 40px);
}
.small {
  font-size: 12.5px;
}
.airlines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.airline-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.airline-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}
.ac-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}
.ac-name {
  font-weight: 700;
  font-size: 17px;
}
.ac-desc {
  font-size: 14px;
  flex: 1;
  margin-bottom: 16px;
}
.ac-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ac-link {
  color: var(--blue-600);
  font-weight: 600;
  font-size: 14px;
}
</style>
