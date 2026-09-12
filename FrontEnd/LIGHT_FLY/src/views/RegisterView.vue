<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { authApi, ApiError } from '@/api'
import { usePendingAuthStore } from '@/stores/pendingAuth'
import AuthShell from '@/components/AuthShell.vue'

const router = useRouter()
const pending = usePendingAuthStore()

const form = ref({ firstName: '', lastName: '', email: '', phone: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const res = await authApi.register({
      email: form.value.email,
      password: form.value.password,
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      phone: form.value.phone || undefined,
    })
    pending.set({ email: res.email, purpose: res.purpose, devCode: res.devCode })
    router.push({ name: 'verify' })
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Ошибка регистрации'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell title="Регистрация" subtitle="Создайте аккаунт и получите скидки по программе лояльности.">
    <form @submit.prevent="submit">
      <p v-if="error" class="alert alert-error">{{ error }}</p>

      <div class="row">
        <div class="field">
          <label>Имя</label>
          <input v-model="form.firstName" class="input" placeholder="Артём" required />
        </div>
        <div class="field">
          <label>Фамилия</label>
          <input v-model="form.lastName" class="input" placeholder="Фарниев" required />
        </div>
      </div>
      <div class="field">
        <label>Email</label>
        <input v-model="form.email" type="email" class="input" placeholder="you@example.com" required />
      </div>
      <div class="field">
        <label>Телефон <span class="muted">(необязательно)</span></label>
        <input v-model="form.phone" class="input" placeholder="+7 999 000-00-00" />
      </div>
      <div class="field">
        <label>Пароль</label>
        <input v-model="form.password" type="password" class="input" placeholder="минимум 6 символов" required />
      </div>

      <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
        {{ loading ? 'Создаём аккаунт…' : 'Зарегистрироваться' }}
      </button>
    </form>

    <p class="switch muted">
      Уже есть аккаунт? <RouterLink to="/login">Войти</RouterLink>
    </p>
  </AuthShell>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.switch {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}
.switch a {
  color: var(--blue-600);
  font-weight: 600;
}
</style>
