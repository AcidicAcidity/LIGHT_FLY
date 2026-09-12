<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppLogo from './AppLogo.vue'
</script>

<template>
  <footer class="footer">
    <div class="container foot-grid">
      <div>
        <AppLogo light />
        <p class="tag">Международный аэропорт LIGHT FLY. Ваше небо начинается здесь.</p>
      </div>
      <div>
        <h4>Пассажирам</h4>
        <RouterLink to="/flights">Онлайн-табло</RouterLink>
        <RouterLink to="/market">Купить билет</RouterLink>
        <RouterLink to="/airlines">Авиакомпании</RouterLink>
        <RouterLink to="/account">Личный кабинет</RouterLink>
      </div>
      <div>
        <h4>Аэропорт</h4>
        <RouterLink to="/about">О нас</RouterLink>
        <RouterLink to="/about">Услуги и сервисы</RouterLink>
        <RouterLink to="/about">Контакты</RouterLink>
      </div>
      <div>
        <h4>Контакты</h4>
        <span>+7 (800) 000-00-00</span>
        <span>info@lightfly.example</span>
        <span>г. Светлоград, Аэропортовское шоссе, 1</span>
      </div>
    </div>
    <div class="container copyright">
      <span>© {{ new Date().getFullYear() }} LIGHT FLY. Учебный проект (СПО, 5 семестр).</span>
      <span>Александров · Кондратенко · Фарниев · Толстикова</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--navy-950);
  color: #cbd5e1;
  padding-top: 56px;
  margin-top: auto;
}
.foot-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1.2fr;
  gap: 32px;
  padding-bottom: 40px;
}
.tag {
  margin-top: 16px;
  max-width: 260px;
  color: #94a3b8;
  font-size: 14px;
}
.footer h4 {
  color: #fff;
  font-size: 15px;
  margin-bottom: 14px;
}
.foot-grid div a,
.foot-grid div span {
  display: block;
  font-size: 14px;
  color: #94a3b8;
  padding: 4px 0;
  transition: color 0.15s ease;
}
.foot-grid div a:hover {
  color: var(--sky-300);
}
.copyright {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-block: 22px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
  color: #64748b;
}
@media (max-width: 760px) {
  .foot-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
