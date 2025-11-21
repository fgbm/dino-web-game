<template>
  <div class="profile-page">
    <div class="profile-header">
      <h2>Личный кабинет</h2>
      <button @click="handleLogout" class="logout-btn">Выйти</button>
    </div>

    <div class="profile-content">
      <div class="user-stats">
        <div class="stat-card">
          <h3>Рекорд</h3>
          <div class="stat-value">{{ userBestScore }}</div>
        </div>
        
        <div class="stat-card">
          <h3>Монеты</h3>
          <div class="stat-value">{{ userCoins }}</div>
        </div>
        
        <div class="stat-card">
          <h3>Скины</h3>
          <div class="stat-value">{{ userSkinsCount }}</div>
        </div>
      </div>

      <div class="user-info">
        <h3>Информация об аккаунте</h3>
        <div class="info-item">
          <span>Имя пользователя:</span>
          <span class="value">{{ currentUser }}</span>
        </div>
        <div class="info-item">
          <span>Дата регистрации:</span>
          <span class="value">{{ registrationDate }}</span>
        </div>
        <div class="info-item">
          <span>Общее время игры:</span>
          <span class="value">{{ totalTimePlayed }} мин</span>
        </div>
      </div>

      <div class="game-history">
        <h3>История игр</h3>
        <div class="history-list">
          <div 
            v-for="(game, index) in recentGames" 
            :key="index" 
            class="game-record"
          >
            <div class="game-date">{{ formatDate(game.date) }}</div>
            <div class="game-score">{{ game.score }}</div>
            <div class="game-duration">{{ formatDuration(game.duration) }}</div>
          </div>
          <div v-if="recentGames.length === 0" class="no-games">
            Нет записей об играх
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { authState, authActions } from '../stores/authStore.js'

const currentUser = computed(() => authState.currentUser)
const userData = computed(() => authActions.getUserData())

const userBestScore = computed(() => {
  return userData.value ? userData.value.best || 0 : 0
})

const userCoins = computed(() => {
  return userData.value ? userData.value.coins || 0 : 0
})

const userSkinsCount = computed(() => {
  return userData.value ? (userData.value.purchased || []).length : 1
})

const registrationDate = computed(() => {
  return userData.value ? userData.value.registrationDate || 'неизвестно' : 'неизвестно'
})

const totalTimePlayed = computed(() => {
  return userData.value ? userData.value.totalTimePlayed || 0 : 0
})

const recentGames = computed(() => {
  return userData.value ? userData.value.recentGames || [] : []
})

function handleLogout() {
  authActions.logout()
}

function formatDate(dateString) {
  if (!dateString) return 'неизвестно'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU')
}

function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds} сек`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (remainingSeconds === 0) {
    return `${minutes} мин`
  }
  return `${minutes} мин ${remainingSeconds} сек`
}
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  color: var(--fg);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-btn {
  background: #ff4757;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
}

.profile-content {
  display: grid;
  gap: 25px;
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  opacity: 0.8;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #6fa8ff;
}

.user-info {
  background: rgba(255, 255, 255, 0.03);
  padding: 20px;
  border-radius: 10px;
}

.user-info h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #6fa8ff;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .value {
  font-weight: bold;
  color: #fff;
}

.game-history {
  background: rgba(255, 255, 255, 0.03);
  padding: 20px;
  border-radius: 10px;
}

.game-history h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #6fa8ff;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.game-record {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
}

.no-games {
  text-align: center;
  opacity: 0.7;
  padding: 20px;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .user-stats {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    gap: 5px;
  }
}
</style>