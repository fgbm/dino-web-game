<template>
  <div class="wrap">
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GameCanvas from './components/GameCanvas.vue'
import GameHUD from './components/GameHUD.vue'
import AuthPanel from './components/AuthPanel.vue'
import SkinShop from './components/SkinShop.vue'

const gameCanvasRef = ref(null)

onMounted(() => {
  // Фокусируем холст для лучшей работы с клавиатурой
  if (gameCanvasRef.value && gameCanvasRef.value.$el) {
    gameCanvasRef.value.$el.focus()
  }
})
</script>

<style>
/* Глобальные стили уже в style.css */
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
}
</style>
