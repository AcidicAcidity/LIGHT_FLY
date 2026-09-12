<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { referenceApi, type Airport, type CabinClass } from '@/api'

const props = defineProps<{
  initial?: { from?: string; to?: string; date?: string; cabinClass?: string }
  compact?: boolean
}>()

const router = useRouter()
const airports = ref<Airport[]>([])
const from = ref(props.initial?.from ?? 'LFL')
const to = ref(props.initial?.to ?? '')
const date = ref(props.initial?.date ?? '')
const cabinClass = ref<CabinClass | ''>((props.initial?.cabinClass as CabinClass) ?? '')

onMounted(async () => {
  try {
    airports.value = await referenceApi.airports()
  } catch {
    /* ignore */
  }
})

function swap() {
  const t = from.value
  from.value = to.value
  to.value = t
}

function submit() {
  router.push({
    name: 'market',
    query: {
      from: from.value || undefined,
      to: to.value || undefined,
      date: date.value || undefined,
      cabinClass: cabinClass.value || undefined,
    },
  })
}
</script>

<template>
  <form class="search-form" :class="{ compact }" @submit.prevent="submit">
    <div class="sf-field">
      <label>Откуда</label>
      <select v-model="from" class="select">
        <option value="">Любой</option>
        <option v-for="a in airports" :key="a.code" :value="a.code">{{ a.city }} ({{ a.code }})</option>
      </select>
    </div>

    <button type="button" class="swap" aria-label="Поменять местами" @click="swap">⇄</button>

    <div class="sf-field">
      <label>Куда</label>
      <select v-model="to" class="select">
        <option value="">Любой</option>
        <option v-for="a in airports" :key="a.code" :value="a.code">{{ a.city }} ({{ a.code }})</option>
      </select>
    </div>

    <div class="sf-field">
      <label>Дата</label>
      <input v-model="date" type="date" class="input" />
    </div>

    <div class="sf-field">
      <label>Класс</label>
      <select v-model="cabinClass" class="select">
        <option value="">Любой</option>
        <option value="ECONOMY">Эконом</option>
        <option value="BUSINESS">Бизнес</option>
        <option value="FIRST">Первый</option>
      </select>
    </div>

    <button type="submit" class="btn btn-accent sf-submit">Найти билеты</button>
  </form>
</template>

<style scoped>
.search-form {
  display: grid;
  grid-template-columns: 1fr auto 1fr 1fr 1fr auto;
  align-items: end;
  gap: 12px;
  background: var(--surface);
  padding: 18px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.sf-field {
  min-width: 0;
}
.sf-field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 5px;
}
.swap {
  height: 44px;
  width: 40px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--surface-2);
  color: var(--blue-500);
  font-size: 18px;
}
.swap:hover {
  border-color: var(--blue-400);
}
.sf-submit {
  height: 44px;
}
@media (max-width: 900px) {
  .search-form {
    grid-template-columns: 1fr 1fr;
  }
  .swap {
    display: none;
  }
  .sf-submit {
    grid-column: 1 / -1;
  }
}
@media (max-width: 520px) {
  .search-form {
    grid-template-columns: 1fr;
  }
}
</style>
