<template>
  <div class="hud">
    <div class="panel">
      Счёт: <span class="font-bold">{{ gameState.score }}</span>
    </div>
    
    <div class="panel">
      Рекорд: <span class="font-bold">{{ gameState.globalBest }}</span>
    </div>
    
    <div class="panel location-label">
      Локация: <span class="font-bold">{{ currentLocation.name }}</span>
    </div>

    <div class="right-col">
      <div class="controls">
        <button 
          @click="gameActions.resetGame"
          :disabled="!gameState.running && gameState.score === 0"
        >
          Перезапуск
        </button>
        
        <button 
          @click="gameActions.changeLocation"
          title="Нажмите L для быстрой смены"
        >
          Сменить локацию (L)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { gameState, gameActions, currentLocation } from '../stores/gameStore.js'
</script>

<style scoped>
.hud {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

@media (max-width: 768px) {
  .hud {
    flex-direction: column;
    align-items: stretch;
  }
  
  .right-col {
    justify-content: center;
  }
}
</style>
