<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import AppLogo from './AppLogo.vue'

const auth = useAuthStore()
const { user, isAuthenticated } = storeToRefs(auth)
const router = useRouter()
const open = ref(false)

const links = [
  { to: '/', label: 'Аэропорт' },
  { to: '/flights', label: 'Онлайн-табло' },
  { to: '/market', label: 'Купить билет' },
  { to: '/airlines', label: 'Авиакомпании' },
  { to: '/about', label: 'О нас' },
]

function logout() {
  auth.logout()
  open.value = false
  router.push('/')
}
</script>

<template>
  <header class="nav">
    <div class="container nav-inner">
      <RouterLink to="/" class="brand" @click="open = false">
        <AppLogo />
      </RouterLink>

      <nav class="links" :class="{ open }">
        <RouterLink v-for="l in links" :key="l.to" :to="l.to" @click="open = false">{{ l.label }}</RouterLink>
      </nav>

      <div class="actions">
        <template v-if="isAuthenticated">
          <RouterLink to="/account" class="account-chip">
            <span class="avatar">{{ user?.firstName?.[0] }}{{ user?.lastName?.[0] }}</span>
            <span class="account-name">{{ user?.firstName }}</span>
          </RouterLink>
          <button class="btn btn-ghost btn-sm" @click="logout">Выйти</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn btn-ghost btn-sm">Войти</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-sm">Регистрация</RouterLink>
        </template>
        <button class="burger" aria-label="Меню" @click="open = !open">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--line);
}
.nav-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 68px;
}
.brand {
  flex-shrink: 0;
}
.links {
  display: flex;
  gap: 4px;
  margin-left: 8px;
  flex: 1;
}
.links a {
  padding: 8px 14px;
  border-radius: 9px;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-soft);
  transition: background 0.15s ease, color 0.15s ease;
}
.links a:hover {
  background: var(--surface-2);
  color: var(--ink);
}
.links a.router-link-active {
  color: var(--blue-600);
  background: #eff4ff;
}
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.account-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 5px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  font-weight: 600;
  font-size: 14px;
}
.account-chip:hover {
  border-color: var(--blue-400);
}
.avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--blue-500), var(--sky-400));
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
.burger {
  display: none;
  flex-direction: column;
  gap: 4px;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--surface);
}
.burger span {
  width: 18px;
  height: 2px;
  background: var(--ink);
  border-radius: 2px;
}

@media (max-width: 900px) {
  .links {
    position: absolute;
    top: 68px;
    left: 0;
    right: 0;
    flex-direction: column;
    background: var(--surface);
    border-bottom: 1px solid var(--line);
    padding: 12px 20px;
    gap: 2px;
    box-shadow: var(--shadow);
    display: none;
  }
  .links.open {
    display: flex;
  }
  .burger {
    display: flex;
  }
  .account-name {
    display: none;
  }
}
</style>
