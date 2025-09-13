<template>
  <div class="auth panel">
    <div class="mb-2">
      <strong>Аккаунт (локально в браузере)</strong>
    </div>
    
    <template v-if="!authState.currentUser">
      <input 
        v-model="formData.username"
        placeholder="Имя пользователя"
        @keyup.enter="handleLogin"
      />
      
      <input 
        v-model="formData.password"
        type="password"
        placeholder="Пароль"
        @keyup.enter="handleLogin"
      />
      
      <div class="auth-form">
        <button @click="handleRegister" :disabled="isLoading">
          Регистрация
        </button>
        <button @click="handleLogin" :disabled="isLoading">
          Войти
        </button>
      </div>
    </template>
    
    <template v-else>
      <div class="user-info">
        <div class="mb-2">
          Добро пожаловать, <span class="font-bold">{{ authState.currentUser }}</span>!
        </div>
        <button @click="handleLogout" class="mb-2">
          Выйти (Esc)
        </button>
      </div>
    </template>
    
    <div 
      v-if="authState.message" 
      class="message"
      :class="authState.messageType"
    >
      {{ authState.message }}
    </div>
    
    <div class="user-info mt-2">
      Пользователь: <span class="font-bold">{{ authState.currentUser || '—' }}</span> | 
      Монеты: <span class="font-bold">{{ userCoins }}</span>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, watch } from 'vue'
import { authState, authActions } from '../stores/authStore.js'

const formData = reactive({
  username: '',
  password: ''
})

const isLoading = ref(false)

const userCoins = computed(() => {
  const userData = authActions.getUserData()
  return userData ? userData.coins : 0
})

function clearForm() {
  formData.username = ''
  formData.password = ''
}

async function handleRegister() {
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    const success = authActions.registerUser(formData.username, formData.password)
    if (success) {
      clearForm()
    }
  } finally {
    isLoading.value = false
  }
}

async function handleLogin() {
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    const success = authActions.loginUser(formData.username, formData.password)
    if (success) {
      clearForm()
    }
  } finally {
    isLoading.value = false
  }
}

function handleLogout() {
  authActions.logout()
  clearForm()
}

// Автоматически очищаем сообщения через 5 секунд
watch(() => authState.message, (newMessage) => {
  if (newMessage) {
    setTimeout(() => {
      authActions.clearMessage()
    }, 5000)
  }
})
</script>

<style scoped>
.auth {
  min-width: 300px;
}

.auth input {
  width: 100%;
  margin: 4px 0;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--fg);
  transition: border-color 0.2s ease;
}

.auth input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.3);
}

.auth-form {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.auth-form button {
  flex: 1;
}

.message {
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 13px;
  margin-top: 8px;
}

.message.success {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.message.error {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.message.info {
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
}

.user-info {
  font-size: 14px;
  line-height: 1.4;
}
</style>
