import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AuthPurpose } from '@/api'

// Хранит контекст между шагом «отправили код» и шагом «подтверждение».
export const usePendingAuthStore = defineStore('pendingAuth', () => {
  const email = ref('')
  const purpose = ref<AuthPurpose>('LOGIN')
  const devCode = ref<string | undefined>(undefined)
  const redirect = ref<string | undefined>(undefined)

  function set(data: { email: string; purpose: AuthPurpose; devCode?: string; redirect?: string }) {
    email.value = data.email
    purpose.value = data.purpose
    devCode.value = data.devCode
    redirect.value = data.redirect
  }
  function clear() {
    email.value = ''
    devCode.value = undefined
    redirect.value = undefined
  }
  return { email, purpose, devCode, redirect, set, clear }
})
