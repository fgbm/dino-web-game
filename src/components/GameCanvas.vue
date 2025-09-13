<template>
  <canvas 
    ref="canvasRef"
    class="game-canvas"
    width="900" 
    height="260"
    @mousedown="handleJump"
    @touchstart.prevent="handleJump"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGameEngine } from '../composables/useGameEngine.js'

const canvasRef = ref(null)

// Инициализируем игровой движок
const { gameState, gameActions } = useGameEngine(canvasRef)

function handleJump() {
  gameActions.jump()
}

// Адаптивное масштабирование
function resizeCanvas() {
  if (canvasRef.value) {
    const maxWidth = Math.min(window.innerWidth - 40, 1000)
    canvasRef.value.style.width = maxWidth + 'px'
    canvasRef.value.style.height = 'auto'
  }
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
})

// Экспортируем состояние для родительского компонента
defineExpose({
  gameState,
  gameActions
})
</script>

<style scoped>
.game-canvas {
  display: block;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.game-canvas:focus {
  outline: none;
}
</style>
