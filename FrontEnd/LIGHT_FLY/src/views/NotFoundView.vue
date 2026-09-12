<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="nf container">
    <div class="nf-code">404</div>
    <h1>Страница не найдена</h1>
    <p class="muted">Возможно, рейс уже улетел. Проверьте адрес или вернитесь на главную.</p>
    <RouterLink to="/" class="btn btn-primary">На главную</RouterLink>
  </div>
</template>

<style scoped>
.nf {
  text-align: center;
  padding: 100px 20px;
}
.nf-code {
  font-size: 96px;
  font-weight: 800;
  color: var(--blue-500);
  letter-spacing: -0.04em;
  line-height: 1;
}
.nf h1 {
  margin: 12px 0 8px;
  font-size: 28px;
}
.nf .btn {
  margin-top: 24px;
}
</style>
