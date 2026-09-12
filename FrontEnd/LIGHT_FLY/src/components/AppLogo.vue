<script setup lang="ts">
defineProps<{ light?: boolean }>()
</script>

<template>
  <span class="logo" :class="{ light }">
    <span class="mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
        <path
          d="M2.5 14.5 21 4l-6.2 16.3-3.1-6.6-6.6-3.1L21 4"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      </svg>
    </span>
    <span class="text">LIGHT<b>FLY</b></span>
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 20px;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--blue-500), var(--sky-400));
  color: #fff;
  box-shadow: var(--shadow-blue);
}
.text b {
  color: var(--blue-500);
  font-weight: 800;
}
.logo.light {
  color: #fff;
}
.logo.light .text b {
  color: var(--sky-300);
}
</style>
