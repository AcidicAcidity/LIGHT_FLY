import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, profileApi, setAuthToken, type AuthUser } from '@/api'

const TOKEN_KEY = 'lightfly_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(readToken())
  const user = ref<AuthUser | null>(null)
  const ready = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  function readToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  }

  function persistToken(value: string | null) {
    try {
      if (value) localStorage.setItem(TOKEN_KEY, value)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* приватный режим — игнорируем */
    }
  }

  function applyToken(value: string) {
    token.value = value
    setAuthToken(value)
    persistToken(value)
  }

  // Восстановление сессии по сохранённому токену
  async function init() {
    if (ready.value) return
    if (token.value) {
      setAuthToken(token.value)
      try {
        const { user: u } = await authApi.me()
        user.value = u
      } catch {
        logout()
      }
    }
    ready.value = true
  }

  function setSession(newToken: string, newUser: AuthUser) {
    applyToken(newToken)
    user.value = newUser
  }

  async function refresh() {
    if (!token.value) return
    try {
      const { user: u } = await authApi.me()
      user.value = u
    } catch {
      /* ignore */
    }
  }

  function logout() {
    token.value = null
    user.value = null
    setAuthToken(null)
    persistToken(null)
  }

  async function updateProfile(data: { firstName?: string; lastName?: string; phone?: string }) {
    await profileApi.update(data)
    await refresh()
  }

  return { token, user, ready, isAuthenticated, init, setSession, refresh, logout, updateProfile }
})
