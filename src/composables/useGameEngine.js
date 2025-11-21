import { ref, onMounted, onUnmounted } from 'vue'
import { gameState, gameActions, currentLocation } from '../stores/gameStore.js'
import { authActions } from '../stores/authStore.js'
import { skinActions, skinState } from '../stores/skinStore.js'

export function useGameEngine(canvasRef) {
  const ctx = ref(null)
  const keys = ref({})
  const animationId = ref(null)
  let lastTime = 0
  let gameStartTime = 0 // Время начала игры

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
      gameStartTime = Date.now() // Запоминаем время начала игры
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
        // Вызываем gameOver из gameStore с дополнительной логикой
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
        
        // Рассчитываем продолжительность игры
        const gameDuration = (Date.now() - gameStartTime) / 1000 // в секундах
        
        // Сохраняем результат игры, если пользователь авторизован
        if (authActions.currentUser) {
          authActions.saveGameResult(gameState.score, Math.floor(gameDuration))
        }
        
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

  function gameOver() {
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
    
    // Рассчитываем продолжительность игры
    const gameDuration = (Date.now() - gameStartTime) / 1000 // в секундах
    
    // Сохраняем результат игры, если пользователь авторизован
    if (authActions.currentUser) {
      authActions.saveGameResult(gameState.score, Math.floor(gameDuration))
    }
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

    // Земля с улучшенным дизайном
    ctx.value.fillStyle = location.ground
    ctx.value.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT)
    
    // Добавляем текстуру земли
    ctx.value.fillStyle = darkenColor(location.ground, 10)
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
      // Небольшие неровности на земле
      ctx.value.fillRect(i, CANVAS_HEIGHT - GROUND_HEIGHT, 10, 2)
    }

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
      // Пустыня - холмы с улучшенным дизайном
      ctx.value.fillStyle = location.colorAccent
      for (let i = 0; i < 6; i++) {
        ctx.value.globalAlpha = 0.12
        ctx.value.beginPath()
        const cx = (i * 220 + (Date.now() / 60 % 220))
        // Рисуем холмы с улучшенной формой
        ctx.value.moveTo(cx - 160, CANVAS_HEIGHT - 70)
        ctx.value.bezierCurveTo(
          cx - 80, CANVAS_HEIGHT - 100,
          cx + 80, CANVAS_HEIGHT - 100,
          cx + 160, CANVAS_HEIGHT - 70
        )
        ctx.value.lineTo(cx + 160, CANVAS_HEIGHT)
        ctx.value.lineTo(cx - 160, CANVAS_HEIGHT)
        ctx.value.closePath()
        ctx.value.fill()
      }
    } else if (location.name === 'Ночь') {
      // Ночь - звезды с улучшенным дизайном
      for (let i = 0; i < 60; i++) {
        const sx = (i * 47) % CANVAS_WIDTH + (i * 13 % 50)
        const sy = 30 + (i * 37 % 80)
        ctx.value.globalAlpha = (i % 7) / 10 + 0.2
        ctx.value.fillStyle = '#fff'
        ctx.value.beginPath()
        ctx.value.arc(sx, sy, 1.5, 0, Math.PI * 2)
        ctx.value.fill()
      }
      // Луна
      ctx.value.globalAlpha = 0.7
      ctx.value.fillStyle = '#eee'
      ctx.value.beginPath()
      ctx.value.arc(800, 60, 20, 0, Math.PI * 2)
      ctx.value.fill()
    } else if (location.name === 'Лес') {
      // Лес - деревья с улучшенным дизайном
      ctx.value.fillStyle = location.colorAccent
      ctx.value.globalAlpha = 0.22
      for (let i = 0; i < 10; i++) {
        const tx = i * 90 + (Date.now() / 80 % 90)
        // Рисуем деревья с улучшенной формой
        ctx.value.beginPath()
        ctx.value.moveTo(tx, CANVAS_HEIGHT - 120 - (i % 3) * 8)
        ctx.value.lineTo(tx - 12, CANVAS_HEIGHT - 70)
        ctx.value.lineTo(tx + 12, CANVAS_HEIGHT - 70)
        ctx.value.closePath()
        ctx.value.fill()
        
        // Ствол дерева
        ctx.value.fillStyle = '#8B4513'
        ctx.value.fillRect(tx - 2, CANVAS_HEIGHT - 120 - (i % 3) * 8, 4, 50)
        ctx.value.fillStyle = location.colorAccent
      }
    } else if (location.name === 'Снег') {
      // Снег - снежинки с улучшенным дизайном
      ctx.value.fillStyle = '#fff'
      for (let i = 0; i < 80; i++) {
        const sx = (i * 97) % CANVAS_WIDTH
        const sy = (Date.now() / 30 + i * 23) % CANVAS_HEIGHT
        ctx.value.globalAlpha = 0.6
        ctx.value.beginPath()
        ctx.value.arc(sx, sy, 1.5, 0, Math.PI * 2)
        ctx.value.fill()
      }
    }

    ctx.value.restore()
  }

  function drawObstacle(obstacle, location) {
    ctx.value.save()
    ctx.value.fillStyle = location.obstacle

    if (obstacle.type === 'bird') {
      // Птица с улучшенным дизайном
      ctx.value.fillStyle = location.obstacle
      ctx.value.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h) // тело
      
      // Крыло
      ctx.value.fillStyle = darkenColor(location.obstacle, 15)
      ctx.value.fillRect(obstacle.x + 4, obstacle.y - 4, obstacle.w - 8, 4)
      
      // Глаз
      ctx.value.fillStyle = '#000'
      ctx.value.beginPath()
      ctx.value.arc(obstacle.x + obstacle.w - 4, obstacle.y + obstacle.h/2, 2, 0, Math.PI * 2)
      ctx.value.fill()
    } else if (obstacle.type === 'rock') {
      // Камень с улучшенным дизайном
      ctx.value.beginPath()
      ctx.value.ellipse(
        obstacle.x + obstacle.w / 2,
        obstacle.y + obstacle.h / 2,
        obstacle.w / 2,
        obstacle.h / 2,
        0, 0, Math.PI * 2
      )
      ctx.value.fill()
      
      // Тени для объема
      ctx.value.fillStyle = darkenColor(location.obstacle, 20)
      ctx.value.beginPath()
      ctx.value.ellipse(
        obstacle.x + obstacle.w / 3,
        obstacle.y + obstacle.h / 3,
        obstacle.w / 4,
        obstacle.h / 4,
        0, 0, Math.PI * 2
      )
      ctx.value.fill()
    } else { // cactus
      // Кактус с улучшенным дизайном
      ctx.value.fillStyle = location.obstacle
      ctx.value.fillRect(obstacle.x, obstacle.y, obstacle.w / 3, obstacle.h) // основной ствол
      
      // Боковые ветки
      ctx.value.fillRect(
        obstacle.x + obstacle.w / 2,
        obstacle.y + obstacle.h * 0.3,
        obstacle.w / 3,
        obstacle.h * 0.4
      )
      
      // Вертикальная ветка
      ctx.value.fillRect(
        obstacle.x - obstacle.w * 0.3,
        obstacle.y + obstacle.h * 0.2,
        obstacle.w / 3,
        obstacle.h * 0.3
      )
      
      // Тени для объема
      ctx.value.fillStyle = darkenColor(location.obstacle, 15)
      ctx.value.fillRect(obstacle.x, obstacle.y, obstacle.w / 6, obstacle.h)
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

    // Тело динозавра (улучшенный дизайн)
    ctx.value.fillStyle = mainColor
    ctx.value.fillRect(0, drawY, player.w, drawH)
    
    // Добавляем тень для объема
    ctx.value.fillStyle = darkenColor(mainColor, 20)
    ctx.value.fillRect(0, drawY, 4, drawH)
    
    // Глаз (улучшенный дизайн)
    ctx.value.fillStyle = '#fff'
    ctx.value.beginPath()
    ctx.value.ellipse(player.w - 18, drawY + 8, 4, 4, 0, 0, Math.PI * 2)
    ctx.value.fill()
    
    ctx.value.fillStyle = '#000'
    ctx.value.beginPath()
    ctx.value.ellipse(player.w - 16, drawY + 10, 2, 2, 0, 0, Math.PI * 2)
    ctx.value.fill()

    // Ноги
    ctx.value.fillStyle = darkenColor(mainColor, 15)
    if (!player.onGround) {
      // Если прыгает, то ноги в воздухе
      ctx.value.fillRect(6, drawY + drawH - 4, 6, 4) // передняя нога
      ctx.value.fillRect(18, drawY + drawH - 4, 6, 4) // задняя нога
    } else {
      // Если на земле, анимация бега
      const legOffset = Math.sin(Date.now() / 100) * 2
      ctx.value.fillRect(6, drawY + drawH - 4, 6, 4) // передняя нога
      ctx.value.fillRect(18, drawY + drawH - 4 + legOffset, 6, 4) // задняя нога
    }

    // Хвост
    ctx.value.fillStyle = darkenColor(mainColor, 10)
    ctx.value.fillRect(player.w - 6, drawY + 6, 8, Math.max(4, drawH * 0.25))
    
    // Если присел, рисуем только верхнюю часть
    if (player.duck) {
      ctx.value.fillStyle = darkenColor(mainColor, 5)
      ctx.value.fillRect(0, drawY, player.w - 6, 4) // спина
    }

    ctx.value.restore()
  }

  // Вспомогательная функция для затемнения цвета
  function darkenColor(color, percent) {
    // Простая реализация для основных цветов
    if (color === '#333') return '#222'
    if (color === '#c33') return '#900'
    if (color === '#d6a95f') return '#b88c3c'
    if (color === '#6fa8ff') return '#4d79cc'
    return '#222' // цвет по умолчанию для теней
  }

  function drawParticles() {
    ctx.value.save()
    ctx.value.globalAlpha = 0.95

    gameState.particles.forEach(particle => {
      if (particle.text) {
        // Текстовые частицы (например, +10 очков)
        ctx.value.fillStyle = '#fff'
        ctx.value.font = 'bold 14px sans-serif'
        ctx.value.textAlign = 'center'
        ctx.value.fillText(particle.text, particle.x, particle.y)
        
        // Добавляем тень для текста
        ctx.value.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.value.fillText(particle.text, particle.x + 1, particle.y + 1)
      } else {
        // Обычные частицы
        ctx.value.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.value.beginPath()
        ctx.value.arc(particle.x, particle.y, 2, 0, Math.PI * 2)
        ctx.value.fill()
      }
    })

    ctx.value.restore()
  }

  function drawGameOverScreen() {
    // Полупрозрачный оверлей
    ctx.value.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.value.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Центральный текст с улучшенным дизайном
    ctx.value.fillStyle = '#fff'
    ctx.value.font = 'bold 28px sans-serif'
    ctx.value.textAlign = 'center'
    ctx.value.fillText('Игра окончена!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
    
    // Подсказка с улучшенным дизайном
    ctx.value.font = '16px sans-serif'
    ctx.value.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.value.fillText('Нажмите Пробел или Перезапуск для новой игры', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
    
    // Отображаем текущий счет
    ctx.value.font = 'bold 20px sans-serif'
    ctx.value.fillStyle = '#6fa8ff'
    ctx.value.fillText(`Счёт: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
  }

  return {
    gameState,
    gameActions
  }
}
