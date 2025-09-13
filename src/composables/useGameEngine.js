import { ref, onMounted, onUnmounted } from 'vue'
import { gameState, gameActions, currentLocation } from '../stores/gameStore.js'
import { authActions } from '../stores/authStore.js'
import { skinActions, skinState } from '../stores/skinStore.js'

export function useGameEngine(canvasRef) {
  const ctx = ref(null)
  const keys = ref({})
  const animationId = ref(null)
  let lastTime = 0

  // Константы
  const CANVAS_WIDTH = 900
  const CANVAS_HEIGHT = 260
  const GROUND_HEIGHT = 40

  // Инициализация
  onMounted(() => {
    if (canvasRef.value) {
      ctx.value = canvasRef.value.getContext('2d')
      gameState.player.baseY = CANVAS_HEIGHT - GROUND_HEIGHT - gameState.player.h
      gameState.player.y = gameState.player.baseY
      
      setupEventListeners()
      startGameLoop()
    }
  })

  onUnmounted(() => {
    cleanup()
  })

  function setupEventListeners() {
    // Клавиатура
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        gameActions.jump()
      }
      if (e.key === 'ArrowDown') {
        keys.value.down = true
      }
      if (e.key === 'l' || e.key === 'L') {
        gameActions.changeLocation()
      }
      if (e.key === 'Escape') {
        if (authActions.currentUser) {
          authActions.logout()
        }
      }
    }

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowDown') {
        keys.value.down = false
      }
    }

    // Мышь и тач
    const handlePointerDown = () => {
      gameActions.jump()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvasRef.value.addEventListener('mousedown', handlePointerDown)
    canvasRef.value.addEventListener('touchstart', (e) => {
      e.preventDefault()
      handlePointerDown()
    }, { passive: false })

    // Сохраняем ссылки для очистки
    canvasRef.value._listeners = {
      handleKeyDown,
      handleKeyUp,
      handlePointerDown
    }
  }

  function cleanup() {
    if (animationId.value) {
      cancelAnimationFrame(animationId.value)
    }

    if (canvasRef.value && canvasRef.value._listeners) {
      const { handleKeyDown, handleKeyUp, handlePointerDown } = canvasRef.value._listeners
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvasRef.value.removeEventListener('mousedown', handlePointerDown)
      canvasRef.value.removeEventListener('touchstart', handlePointerDown)
    }
  }

  function startGameLoop() {
    const gameLoop = (currentTime) => {
      const deltaTime = Math.min(60, currentTime - lastTime)
      lastTime = currentTime

      update(deltaTime / 16.67) // Нормализуем к 60 FPS
      draw()

      animationId.value = requestAnimationFrame(gameLoop)
    }

    animationId.value = requestAnimationFrame(gameLoop)
  }

  function update(deltaTime) {
    if (!gameState.running) return

    // Увеличиваем скорость
    gameState.speed += 0.0009 * deltaTime

    // Спавн препятствий
    gameState.spawnTimer += 1
    if (gameState.spawnTimer > gameState.spawnInterval) {
      gameState.spawnTimer = 0
      gameState.spawnInterval = 60 + Math.random() * 80
      gameActions.spawnObstacle()
    }

    // Физика игрока
    updatePlayerPhysics(deltaTime)

    // Обновление препятствий
    updateObstacles(deltaTime)

    // Обновление частиц
    updateParticles(deltaTime)

    // Обновление счета
    updateScore(deltaTime)
  }

  function updatePlayerPhysics(deltaTime) {
    const player = gameState.player

    // Гравитация
    if (!player.onGround) {
      player.vy += gameState.gravity
      player.y += player.vy
      
      if (player.y >= player.baseY) {
        player.y = player.baseY
        player.vy = 0
        player.onGround = true
      }
    }

    // Приседание (только на земле)
    player.duck = !!keys.value.down && player.onGround
  }

  function updateObstacles(deltaTime) {
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
      const obstacle = gameState.obstacles[i]
      obstacle.x -= gameState.speed

      // Удаляем препятствия за экраном
      if (obstacle.x + obstacle.w < -60) {
        gameState.obstacles.splice(i, 1)
        continue
      }

      // Начисление очков за прохождение препятствия
      if (!obstacle.passed && obstacle.x + obstacle.w < gameState.player.x) {
        obstacle.passed = true
        gameState.score += 10
        gameActions.createScoreParticle(obstacle.x + obstacle.w / 2, obstacle.y)

        // Начисляем монеты пользователю
        if (authActions.currentUser) {
          authActions.addCoins(1)
        }
      }

      // Проверка коллизий
      if (checkCollision(gameState.player, obstacle)) {
        gameActions.gameOver()
        
        // Обновляем рекорд пользователя
        if (authActions.currentUser) {
          authActions.updateBest(gameState.score)
        }
        break
      }
    }
  }

  function updateParticles(deltaTime) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      const particle = gameState.particles[i]
      particle.vy += 0.3
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life -= 1

      if (particle.life <= 0) {
        gameState.particles.splice(i, 1)
      }
    }
  }

  function updateScore(deltaTime) {
    gameState.score += 0.05 * deltaTime
    gameState.score = Math.floor(gameState.score)
    gameActions.updateScore(gameState.score)
  }

  function checkCollision(player, obstacle) {
    // Учитываем приседание при расчете коллизии
    const drawH = player.duck ? Math.round(player.h * 0.55) : player.h
    const drawYOffset = player.duck ? Math.round(player.h - drawH) : 0

    const playerRect = {
      x: player.x,
      y: player.y + drawYOffset,
      w: player.w,
      h: drawH
    }

    const obstacleRect = {
      x: obstacle.x,
      y: obstacle.y,
      w: obstacle.w,
      h: obstacle.h
    }

    return rectsOverlap(playerRect, obstacleRect)
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && 
           a.x + a.w > b.x && 
           a.y < b.y + b.h && 
           a.y + a.h > b.y
  }

  function draw() {
    if (!ctx.value) return

    ctx.value.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    const location = currentLocation.value

    // Небо
    ctx.value.fillStyle = location.sky
    ctx.value.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Параллакс фон
    drawParallax(location)

    // Земля
    ctx.value.fillStyle = location.ground
    ctx.value.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT)

    // Препятствия
    gameState.obstacles.forEach(obstacle => drawObstacle(obstacle, location))

    // Игрок
    drawPlayer(gameState.player, location)

    // Частицы
    drawParticles()

    // Экран окончания игры
    if (!gameState.running) {
      drawGameOverScreen()
    }
  }

  function drawParallax(location) {
    ctx.value.save()

    if (location.name === 'Пустыня') {
      ctx.value.fillStyle = location.colorAccent
      for (let i = 0; i < 6; i++) {
        ctx.value.globalAlpha = 0.12
        ctx.value.beginPath()
        const cx = (i * 220 + (Date.now() / 60 % 220))
        ctx.value.ellipse(cx, CANVAS_HEIGHT - 70, 160, 30, 0, 0, Math.PI * 2)
        ctx.value.fill()
      }
    } else if (location.name === 'Ночь') {
      ctx.value.fillStyle = '#fff'
      for (let i = 0; i < 60; i++) {
        const sx = (i * 47) % CANVAS_WIDTH + (i * 13 % 50)
        const sy = 30 + (i * 37 % 80)
        ctx.value.globalAlpha = (i % 7) / 10 + 0.2
        ctx.value.fillRect(sx, sy, 2, 2)
      }
    } else if (location.name === 'Лес') {
      ctx.value.fillStyle = location.colorAccent
      ctx.value.globalAlpha = 0.22
      for (let i = 0; i < 10; i++) {
        const tx = i * 90 + (Date.now() / 80 % 90)
        ctx.value.fillRect(tx, CANVAS_HEIGHT - 120 - (i % 3) * 8, 24, 120)
      }
    } else if (location.name === 'Снег') {
      ctx.value.fillStyle = '#fff'
      for (let i = 0; i < 80; i++) {
        const sx = (i * 97) % CANVAS_WIDTH
        const sy = (Date.now() / 30 + i * 23) % CANVAS_HEIGHT
        ctx.value.globalAlpha = 0.6
        ctx.value.fillRect(sx, sy, 2, 2)
      }
    }

    ctx.value.restore()
  }

  function drawObstacle(obstacle, location) {
    ctx.value.save()
    ctx.value.fillStyle = location.obstacle

    if (obstacle.type === 'bird') {
      ctx.value.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h)
      ctx.value.fillRect(obstacle.x + 6, obstacle.y - 6, 12, 6)
    } else if (obstacle.type === 'rock') {
      ctx.value.beginPath()
      ctx.value.ellipse(
        obstacle.x + obstacle.w / 2,
        obstacle.y + obstacle.h / 2,
        obstacle.w / 2,
        obstacle.h / 2,
        0, 0, Math.PI * 2
      )
      ctx.value.fill()
    } else { // cactus
      ctx.value.fillRect(obstacle.x, obstacle.y, obstacle.w / 3, obstacle.h)
      ctx.value.fillRect(
        obstacle.x + obstacle.w / 2,
        obstacle.y + obstacle.h * 0.3,
        obstacle.w / 3,
        obstacle.h * 0.7
      )
    }

    ctx.value.restore()
  }

  function drawPlayer(player, location) {
    ctx.value.save()
    
    const skinData = skinActions.getCurrentSkinData()
    const mainColor = skinData.color || '#333'

    // Учитываем приседание
    const drawH = player.duck ? Math.round(player.h * 0.55) : player.h
    const drawY = player.duck ? (player.h - drawH) : 0

    ctx.value.translate(player.x, player.y)

    // Тело
    ctx.value.fillStyle = mainColor
    ctx.value.fillRect(0, drawY, player.w, drawH)

    // Хвост
    ctx.value.fillStyle = '#222'
    ctx.value.fillRect(player.w - 6, drawY + 6, 6, Math.max(6, drawH * 0.25))

    // Глаз
    ctx.value.fillStyle = '#fff'
    ctx.value.fillRect(player.w - 18, drawY + 8, 6, 6)
    ctx.value.fillStyle = '#000'
    ctx.value.fillRect(player.w - 16, drawY + 10, 2, 2)

    ctx.value.restore()
  }

  function drawParticles() {
    ctx.value.save()
    ctx.value.globalAlpha = 0.95

    gameState.particles.forEach(particle => {
      if (particle.text) {
        ctx.value.fillStyle = '#fff'
        ctx.value.font = '12px monospace'
        ctx.value.fillText(particle.text, particle.x, particle.y)
      } else {
        ctx.value.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.value.fillRect(particle.x, particle.y, 3, 3)
      }
    })

    ctx.value.restore()
  }

  function drawGameOverScreen() {
    ctx.value.fillStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.value.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    ctx.value.fillStyle = '#fff'
    ctx.value.font = '24px sans-serif'
    ctx.value.textAlign = 'center'
    ctx.value.fillText(
      'Игра окончена — нажмите Перезапуск или пробел',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2
    )
  }

  return {
    gameState,
    gameActions
  }
}
