import { reactive, computed } from 'vue'

// Локации игры
export const locations = [
  { name: 'Пустыня', sky: '#f6ecd7', ground: '#e5c07b', obstacle: '#6b4f2b', colorAccent: '#d6a95f' },
  { name: 'Ночь', sky: '#05060a', ground: '#1b1f2a', obstacle: '#9ab3ff', colorAccent: '#6fa8ff' },
  { name: 'Лес', sky: '#dff3e6', ground: '#6aa84f', obstacle: '#2f5b2f', colorAccent: '#3c8c3c' },
  { name: 'Снег', sky: '#e8f0ff', ground: '#dbe9f7', obstacle: '#6f8aa3', colorAccent: '#9fb7d9' }
]

// Скины для динозавра
export const skins = [
  { id: 'default', name: 'Классический', color: '#333', price: 0 },
  { id: 'red', name: 'Красный', color: '#c33', price: 50 },
  { id: 'gold', name: 'Золотой', color: '#d6a95f', price: 120 },
  { id: 'neon', name: 'Неон', color: '#6fa8ff', price: 90 }
]

// Состояние игры
export const gameState = reactive({
  // Основные параметры
  score: 0,
  globalBest: Number(localStorage.getItem('dino_best') || 0),
  running: true,
  speed: 4,
  
  // Локация
  locationIndex: 0,
  
  // Игровые объекты
  obstacles: [],
  particles: [],
  
  // Таймеры
  spawnTimer: 0,
  spawnInterval: 90,
  
  // Физика
  gravity: 0.6,
  
  // Игрок
  player: {
    x: 80,
    y: 0,
    w: 44,
    h: 44,
    vy: 0,
    onGround: true,
    duck: false,
    baseY: 0
  }
})

// Вычисляемые свойства
export const currentLocation = computed(() => locations[gameState.locationIndex])

// Методы управления игрой
export const gameActions = {
  resetGame() {
    gameState.obstacles = []
    gameState.particles = []
    gameState.score = 0
    gameState.speed = 4
    gameState.spawnInterval = 90
    gameState.running = true
    gameState.player.y = gameState.player.baseY
    gameState.player.vy = 0
    gameState.player.onGround = true
    gameState.player.duck = false
  },

  changeLocation() {
    gameState.locationIndex = (gameState.locationIndex + 1) % locations.length
  },

  jump() {
    if (!gameState.running) {
      this.resetGame()
      return
    }
    if (gameState.player.onGround && !gameState.player.duck) {
      gameState.player.vy = -12
      gameState.player.onGround = false
    }
  },

  updateScore(newScore) {
    gameState.score = newScore
    if (newScore > gameState.globalBest) {
      gameState.globalBest = newScore
      localStorage.setItem('dino_best', newScore)
    }
  },

  gameOver() {
    gameState.running = false
    // Создаем эффект взрыва
    for (let i = 0; i < 30; i++) {
      gameState.particles.push({
        x: gameState.player.x + gameState.player.w / 2,
        y: gameState.player.y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 6,
        life: 80,
        text: ''
      })
    }
  },

  spawnObstacle() {
    const types = ['cactus', 'bird', 'rock']
    const type = types[Math.floor(Math.random() * types.length)]
    const obstacle = {
      type,
      x: 900 + 20, // Ширина холста + отступ
      w: 20 + Math.random() * 30,
      passed: false
    }

    if (type === 'bird') {
      obstacle.h = 24
      obstacle.y = 260 - 40 - obstacle.h - (20 + Math.random() * 40) // H - groundH - высота препятствия - случайная высота
    } else {
      obstacle.h = 30 + Math.random() * 30
      obstacle.y = 260 - 40 - obstacle.h // H - groundH - высота препятствия
    }

    gameState.obstacles.push(obstacle)
  },

  createScoreParticle(x, y) {
    gameState.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -3,
      life: 50,
      text: '+10'
    })
  }
}
