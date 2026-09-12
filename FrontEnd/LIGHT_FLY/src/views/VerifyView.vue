<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authApi, ApiError } from '@/api'
import { usePendingAuthStore } from '@/stores/pendingAuth'
import { useAuthStore } from '@/stores/auth'
import AuthShell from '@/components/AuthShell.vue'

const router = useRouter()
const pending = usePendingAuthStore()
const auth = useAuthStore()

const code = ref('')
const error = ref('')
const info = ref('')
const loading = ref(false)

onMounted(() => {
  if (!pending.email) {
    router.replace({ name: 'login' })
    return
  }
  // В dev-режиме подставляем код автоматически для удобной проверки
  if (pending.devCode) code.value = pending.devCode
})

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const res = await authApi.verify({ email: pending.email, code: code.value, purpose: pending.purpose })
    auth.setSession(res.token, res.user)
    const redirect = pending.redirect
    pending.clear()
    router.replace(redirect || { name: 'account' })
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Неверный код'
  } finally {
    loading.value = false
  }
}

async function resend() {
  info.value = ''
  error.value = ''
  try {
    const res = await authApi.resend({ email: pending.email, purpose: pending.purpose })
    if (res.devCode) {
      code.value = res.devCode
      info.value = `Новый код отправлен (dev-код: ${res.devCode}).`
    } else {
      info.value = 'Новый код отправлен на email.'
    }
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Не удалось отправить код'
  }
}
</script>

<template>
  <AuthShell title="Подтверждение" :subtitle="`Мы отправили 6-значный код на ${pending.email}`">
    <form @submit.prevent="submit">
      <p v-if="error" class="alert alert-error">{{ error }}</p>
      <p v-if="info" class="alert alert-info">{{ info }}</p>

      <div class="field">
        <label>Код из письма</label>
        <input
          v-model="code"
          class="input code-input"
          inputmode="numeric"
          maxlength="6"
          placeholder="000000"
          required
        />
      </div>

      <button type="submit" class="btn btn-primary btn-block" :disabled="loading || code.length !== 6">
        {{ loading ? 'Проверяем…' : 'Подтвердить' }}
      </button>
    </form>

    <div class="dev-note" v-if="pending.devCode">
      🔧 Режим разработки: код подставлен автоматически. В боевом режиме он приходит письмом.
    </div>

    <p class="switch muted">
      Не пришёл код? <button class="link" @click="resend">Отправить ещё раз</button>
    </p>
  </AuthShell>
</template>

<style scoped>
.code-input {
  text-align: center;
  font-size: 28px;
  letter-spacing: 10px;
  font-weight: 700;
}
.switch {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}
.link {
  background: none;
  border: none;
  color: var(--blue-600);
  font-weight: 600;
  font-size: 14px;
  padding: 0;
}
.dev-note {
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: #fffbeb;
  color: #b45309;
  font-size: 13px;
}
</style>
