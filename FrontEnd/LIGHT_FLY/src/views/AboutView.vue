<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { infoApi, type AirportInfo } from '@/api'

const info = ref<AirportInfo | null>(null)
const openFaq = ref<number | null>(0)

onMounted(async () => {
  info.value = await infoApi.airport()
})
</script>

<template>
  <div class="page" v-if="info">
    <section class="about-hero">
      <div class="container">
        <span class="eyebrow light">О аэропорте</span>
        <h1>{{ info.name }}</h1>
        <p>{{ info.about }}</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <h2>Терминалы</h2>
        </div>
        <div class="term-grid">
          <div v-for="t in info.terminals" :key="t.name" class="card term">
            <h3>{{ t.name }}</h3>
            <p class="muted">{{ t.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section services">
      <div class="container">
        <div class="section-head">
          <h2>Услуги и сервисы</h2>
        </div>
        <div class="svc-grid">
          <div v-for="s in info.services" :key="s.title" class="card svc">
            <h3>{{ s.title }}</h3>
            <p class="muted">{{ s.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container faq-wrap">
        <div class="section-head">
          <h2>Частые вопросы</h2>
        </div>
        <div class="faq">
          <div v-for="(f, i) in info.faq" :key="i" class="faq-item card" :class="{ open: openFaq === i }">
            <button class="faq-q" @click="openFaq = openFaq === i ? null : i">
              <span>{{ f.q }}</span>
              <span class="faq-arrow">{{ openFaq === i ? '−' : '+' }}</span>
            </button>
            <div v-if="openFaq === i" class="faq-a muted">{{ f.a }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="section contacts-band">
      <div class="container contacts">
        <div>
          <h2>Контакты</h2>
          <p class="muted">Мы на связи круглосуточно.</p>
        </div>
        <div class="contacts-grid">
          <div><span class="muted small">Телефон</span><b>{{ info.contacts.phone }}</b></div>
          <div><span class="muted small">Email</span><b>{{ info.contacts.email }}</b></div>
          <div><span class="muted small">Адрес</span><b>{{ info.contacts.address }}</b></div>
          <div><span class="muted small">Режим работы</span><b>{{ info.contacts.hours }}</b></div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-hero {
  background: linear-gradient(160deg, var(--navy-900), var(--navy-700));
  color: #fff;
  padding: 64px 0;
}
.about-hero h1 {
  font-size: clamp(28px, 5vw, 44px);
  margin-bottom: 16px;
}
.about-hero p {
  max-width: 680px;
  color: #cbd5e1;
  font-size: 17px;
}
.eyebrow.light {
  color: var(--sky-300);
}
.term-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.term {
  padding: 26px;
}
.term h3 {
  font-size: 19px;
  margin-bottom: 10px;
  color: var(--blue-600);
}
.services {
  background: var(--surface-2);
}
.svc-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.svc {
  padding: 22px;
}
.svc h3 {
  font-size: 16px;
  margin-bottom: 8px;
}
.faq-wrap {
  max-width: 780px;
}
.faq {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.faq-q {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: transparent;
  border: none;
  padding: 18px 22px;
  font-size: 16px;
  font-weight: 600;
  text-align: left;
  color: var(--ink);
}
.faq-arrow {
  font-size: 22px;
  color: var(--blue-500);
}
.faq-a {
  padding: 0 22px 18px;
  font-size: 15px;
}
.contacts-band {
  background: var(--navy-950);
  color: #fff;
}
.contacts {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 32px;
  align-items: center;
}
.contacts h2 {
  color: #fff;
}
.contacts .muted {
  color: #94a3b8 !important;
}
.contacts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.contacts-grid div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.contacts-grid .small {
  color: #64748b !important;
  font-size: 12.5px;
}
.contacts-grid b {
  font-size: 16px;
}
@media (max-width: 760px) {
  .term-grid,
  .svc-grid,
  .contacts,
  .contacts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
