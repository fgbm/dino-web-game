<template>
  <div class="wrap">
    <nav class="navigation">
      <button 
        :class="{ active: currentPage === 'game' }"
        @click="currentPage = 'game'"
      >
        Игра
      </button>
      <button 
        :class="{ active: currentPage === 'profile' }"
        @click="currentPage = 'profile'"
        :disabled="!authState.currentUser"
      >
        Профиль
      </button>
    </nav>

    <div v-if="currentPage === 'game'" class="game-section">
      <h2 class="text-center mb-2">
        Динозаврик — HTML игра (в стиле Google T-Rex)
      </h2>

      <!-- Панель управления игрой -->
      <GameHUD />

      <!-- Боковые панели -->
      <div class="side">
        <AuthPanel />
        <SkinShop />
      </div>

      <!-- Игровой холст -->
      <GameCanvas ref="gameCanvasRef" />
      
      <!-- Подсказки по управлению -->
      <div class="controls-hint small text-center">
        <strong>Управление:</strong> пробел или клик — прыжок, стрелка вниз — присесть, L — смена локации.<br>
        На мобильных: тап — прыжок. ESC — выйти из аккаунта.
      </div>
    </div>

    <div v-else-if="currentPage === 'profile'">
      <ProfilePage />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { authState } from './stores/authStore.js'
import GameCanvas from './components/GameCanvas.vue'
import GameHUD from './components/GameHUD.vue'
import AuthPanel from './components/AuthPanel.vue'
import SkinShop from './components/SkinShop.vue'
import ProfilePage from './components/ProfilePage.vue'

const gameCanvasRef = ref(null)
const currentPage = ref('game')

onMounted(() => {
  // Фокусируем холст для лучшей работы с клавиатурой
  if (gameCanvasRef.value && gameCanvasRef.value.$el) {
    gameCanvasRef.value.$el.focus()
  }
})
</script>

<style>
/* Глобальные стили уже в style.css */
.navigation {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.navigation button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.navigation button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.navigation button.active {
  background: #6fa8ff;
  color: #000;
}

.navigation button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.controls-hint {
  max-width: 600px;
  margin: 12px auto;
  line-height: 1.4;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .controls-hint {
    font-size: 12px;
    padding: 0 16px;
  }
  
  .navigation {
    flex-wrap: wrap;
  }
}
</style>
