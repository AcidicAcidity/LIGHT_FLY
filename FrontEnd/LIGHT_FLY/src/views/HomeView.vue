<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { infoApi, flightsApi, type AirportInfo, type Flight } from '@/api'
import SearchForm from '@/components/SearchForm.vue'
import { formatPrice } from '@/composables/format'

function svcIcon(name: string): string {
  const map: Record<string, string> = {
    wifi: '📶',
    parking: '🅿️',
    lounge: '🛋️',
    shop: '🛍️',
    baggage: '🧳',
    medical: '⛑️',
  }
  return map[name] ?? '✈️'
}

const info = ref<AirportInfo | null>(null)
const popular = ref<{ city: string; code: string; price: number | null; airline: string }[]>([])

onMounted(async () => {
  try {
    info.value = await infoApi.airport()
  } catch {
    /* ignore */
  }
  try {
    const { flights } = await flightsApi.board('departures')
    const seen = new Set<string>()
    const list: typeof popular.value = []
    for (const f of flights as Flight[]) {
      if (seen.has(f.arrival.code)) continue
      seen.add(f.arrival.code)
      list.push({ city: f.arrival.city, code: f.arrival.code, price: f.minPrice, airline: f.airline.name })
      if (list.length >= 6) break
    }
    popular.value = list
  } catch {
    /* ignore */
  }
})
</script>

<template>
  <div>
    <!-- HERO -->
    <section class="hero">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="container hero-inner">
        <span class="eyebrow light">✈ Международный аэропорт LIGHT FLY</span>
        <h1>Ваше небо <br />начинается здесь</h1>
        <p class="hero-sub">
          Прямые рейсы в {{ info?.stats?.[0]?.value ?? '40+' }} городов, билеты от ведущих авиакомпаний и удобный
          личный кабинет со скидочной программой.
        </p>
        <div class="hero-search">
          <SearchForm />
        </div>
      </div>
    </section>

    <!-- STATS -->
    <section class="stats-band" v-if="info">
      <div class="container stats-grid">
        <div v-for="s in info.stats" :key="s.label" class="stat">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </section>

    <!-- POPULAR DESTINATIONS -->
    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Куда полететь</span>
          <h2>Популярные направления</h2>
          <p>Ближайшие прямые рейсы из аэропорта LIGHT FLY. Цены — минимальные по направлению.</p>
        </div>
        <div class="dest-grid">
          <RouterLink
            v-for="d in popular"
            :key="d.code"
            :to="{ name: 'market', query: { from: 'LFL', to: d.code } }"
            class="dest-card"
          >
            <div class="dest-top">
              <span class="dest-city">{{ d.city }}</span>
              <span class="dest-code">{{ d.code }}</span>
            </div>
            <div class="dest-bottom">
              <span class="muted">{{ d.airline }}</span>
              <span class="dest-price">от {{ formatPrice(d.price) }}</span>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- SERVICES -->
    <section class="section services" v-if="info">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Сервисы</span>
          <h2>Комфорт в каждом терминале</h2>
        </div>
        <div class="svc-grid">
          <div v-for="s in info.services" :key="s.title" class="svc-card card">
            <div class="svc-ico">{{ svcIcon(s.icon) }}</div>
            <h3>{{ s.title }}</h3>
            <p class="muted">{{ s.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="container cta-inner">
        <div>
          <h2>Летайте выгоднее с программой лояльности</h2>
          <p>Копите мили с каждой покупки и получайте скидки до 15%. Зарегистрируйтесь за минуту.</p>
        </div>
        <RouterLink to="/register" class="btn btn-accent">Создать аккаунт</RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  color: #fff;
  padding: 80px 0 130px;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1200px 500px at 80% -10%, rgba(56, 189, 248, 0.35), transparent 60%),
    radial-gradient(900px 500px at 0% 20%, rgba(37, 99, 235, 0.35), transparent 55%),
    linear-gradient(160deg, var(--navy-900), var(--navy-800) 55%, var(--navy-700));
}
.hero-inner {
  position: relative;
}
.eyebrow.light {
  color: var(--sky-300);
}
.hero h1 {
  font-size: clamp(38px, 7vw, 72px);
  line-height: 1.02;
  margin-bottom: 18px;
}
.hero-sub {
  max-width: 540px;
  font-size: 18px;
  color: #cbd5e1;
  margin-bottom: 36px;
}
.hero-search {
  max-width: 1050px;
}

.stats-band {
  margin-top: -60px;
  position: relative;
  z-index: 2;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}
.stat {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px;
  text-align: center;
  box-shadow: var(--shadow-sm);
}
.stat-value {
  font-size: 30px;
  font-weight: 800;
  color: var(--blue-600);
  letter-spacing: -0.02em;
}
.stat-label {
  color: var(--muted);
  font-size: 14px;
  margin-top: 4px;
}

.dest-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.dest-card {
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: var(--surface);
  padding: 20px 22px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.dest-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
  border-color: var(--blue-400);
}
.dest-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 18px;
}
.dest-city {
  font-size: 20px;
  font-weight: 700;
}
.dest-code {
  font-size: 13px;
  font-weight: 700;
  color: var(--blue-500);
  background: #eff4ff;
  padding: 3px 9px;
  border-radius: 7px;
}
.dest-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}
.dest-price {
  font-weight: 800;
  font-size: 17px;
}

.services {
  background: var(--surface-2);
}
.svc-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.svc-card {
  padding: 26px;
}
.svc-ico {
  font-size: 30px;
  margin-bottom: 12px;
}
.svc-card h3 {
  font-size: 17px;
  margin-bottom: 8px;
}
.svc-card p {
  font-size: 14px;
}

.cta {
  padding-block: 64px;
}
.cta-inner {
  background: linear-gradient(135deg, var(--navy-800), var(--blue-600));
  border-radius: var(--radius-lg);
  padding: 44px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
}
.cta-inner h2 {
  font-size: 26px;
  margin-bottom: 8px;
}
.cta-inner p {
  color: #dbeafe;
  max-width: 520px;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dest-grid,
  .svc-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 620px) {
  .dest-grid,
  .svc-grid {
    grid-template-columns: 1fr;
  }
  .cta-inner {
    flex-direction: column;
    text-align: center;
    align-items: stretch;
  }
}
</style>
