<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppLogo from './AppLogo.vue'
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="auth">
    <div class="auth-visual">
      <div class="auth-visual-inner">
        <RouterLink to="/"><AppLogo light /></RouterLink>
        <h2>Ваше небо начинается здесь</h2>
        <p>Покупайте билеты ведущих авиакомпаний, копите мили и получайте скидки до 15% в программе лояльности LIGHT FLY.</p>
        <ul>
          <li>✓ Билеты от 6 перевозчиков</li>
          <li>✓ Двухфакторная защита входа</li>
          <li>✓ Личный кабинет и история поездок</li>
        </ul>
      </div>
    </div>
    <div class="auth-form-side">
      <div class="auth-card">
        <div class="auth-head">
          <h1>{{ title }}</h1>
          <p v-if="subtitle" class="muted">{{ subtitle }}</p>
        </div>
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: calc(100vh - 68px);
}
.auth-visual {
  position: relative;
  color: #fff;
  padding: 56px;
  display: flex;
  align-items: center;
  background:
    radial-gradient(700px 400px at 20% 10%, rgba(56, 189, 248, 0.3), transparent 60%),
    linear-gradient(160deg, var(--navy-900), var(--navy-700));
}
.auth-visual-inner {
  max-width: 420px;
}
.auth-visual h2 {
  font-size: 32px;
  margin: 40px 0 16px;
  line-height: 1.15;
}
.auth-visual p {
  color: #cbd5e1;
  font-size: 16px;
}
.auth-visual ul {
  list-style: none;
  padding: 0;
  margin: 28px 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--sky-300);
  font-weight: 500;
}
.auth-form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}
.auth-card {
  width: 100%;
  max-width: 400px;
}
.auth-head {
  margin-bottom: 24px;
}
.auth-head h1 {
  font-size: 28px;
}
.auth-head p {
  margin-top: 6px;
}
@media (max-width: 880px) {
  .auth {
    grid-template-columns: 1fr;
  }
  .auth-visual {
    display: none;
  }
}
</style>
