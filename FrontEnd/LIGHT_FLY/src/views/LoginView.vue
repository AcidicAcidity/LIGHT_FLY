<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { authApi, ApiError } from '@/api'
import { usePendingAuthStore } from '@/stores/pendingAuth'
import AuthShell from '@/components/AuthShell.vue'

const route = useRoute()
const router = useRouter()
const pending = usePendingAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const res = await authApi.login({ email: email.value, password: password.value })
    pending.set({
      email: res.email,
      purpose: res.purpose,
      devCode: res.devCode,
      redirect: (route.query.redirect as string) || undefined,
    })
    router.push({ name: 'verify' })
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell title="Вход в аккаунт" subtitle="Введите данные — мы отправим код подтверждения на email.">
    <form @submit.prevent="submit">
      <p v-if="error" class="alert alert-error">{{ error }}</p>

      <div class="field">
        <label>Email</label>
        <input v-model="email" type="email" class="input" placeholder="you@example.com" required />
      </div>
      <div class="field">
        <label>Пароль</label>
        <input v-model="password" type="password" class="input" placeholder="••••••" required />
      </div>

      <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
        {{ loading ? 'Отправляем код…' : 'Продолжить' }}
      </button>
    </form>

    <div class="demo-hint">
      <b>Демо-доступ:</b> demo@lightfly.ru / password123
    </div>

    <p class="switch muted">
      Нет аккаунта? <RouterLink to="/register">Зарегистрироваться</RouterLink>
    </p>
  </AuthShell>
</template>

<style scoped>
.switch {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}
.switch a {
  color: var(--blue-600);
  font-weight: 600;
}
.demo-hint {
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: #eff6ff;
  color: #1e40af;
  font-size: 13px;
}
</style>
