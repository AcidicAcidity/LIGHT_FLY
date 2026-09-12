<script setup lang="ts">
defineProps<{ text: string; color: string; size?: number }>()
</script>

<template>
  <span
    class="airline-badge"
    :style="{ background: color, width: (size ?? 40) + 'px', height: (size ?? 40) + 'px', fontSize: (size ?? 40) * 0.34 + 'px' }"
  >
    {{ text }}
  </span>
</template>

<style scoped>
.airline-badge {
  display: inline-grid;
  place-items: center;
  border-radius: 10px;
  color: #fff;
  font-weight: 800;
  letter-spacing: -0.02em;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}
</style>
