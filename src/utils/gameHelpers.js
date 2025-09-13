/**
 * Вспомогательные функции для игры
 */

import { GAME_CONFIG, OBSTACLE_TYPES } from './constants.js'

/**
 * Проверка пересечения двух прямоугольников
 * @param {Object} rect1 - первый прямоугольник {x, y, w, h}
 * @param {Object} rect2 - второй прямоугольник {x, y, w, h}
 * @returns {boolean}
 */
export function rectsOverlap(rect1, rect2) {
  return rect1.x < rect2.x + rect2.w && 
         rect1.x + rect1.w > rect2.x && 
         rect1.y < rect2.y + rect2.h && 
         rect1.y + rect1.h > rect2.y
}

/**
 * Создание случайного препятствия
 * @returns {Object} препятствие
 */
export function createRandomObstacle() {
  const types = Object.values(OBSTACLE_TYPES)
  const type = types[Math.floor(Math.random() * types.length)]
  
  const obstacle = {
    type,
    x: GAME_CONFIG.CANVAS_WIDTH + 20,
    w: GAME_CONFIG.OBSTACLES.MIN_WIDTH + Math.random() * (GAME_CONFIG.OBSTACLES.MAX_WIDTH - GAME_CONFIG.OBSTACLES.MIN_WIDTH),
    passed: false
  }

  if (type === OBSTACLE_TYPES.BIRD) {
    obstacle.h = GAME_CONFIG.OBSTACLES.BIRD_HEIGHT
    obstacle.y = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT - obstacle.h - (20 + Math.random() * GAME_CONFIG.OBSTACLES.BIRD_Y_VARIATION)
  } else {
    obstacle.h = GAME_CONFIG.OBSTACLES.MIN_HEIGHT + Math.random() * (GAME_CONFIG.OBSTACLES.MAX_HEIGHT - GAME_CONFIG.OBSTACLES.MIN_HEIGHT)
    obstacle.y = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT - obstacle.h
  }

  return obstacle
}

/**
 * Создание частицы для эффектов
 * @param {number} x - позиция X
 * @param {number} y - позиция Y
 * @param {string} text - текст частицы (опционально)
 * @returns {Object} частица
 */
export function createParticle(x, y, text = '') {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * (text ? 2 : 6),
    vy: text ? -3 : -Math.random() * 6,
    life: text ? 50 : GAME_CONFIG.PARTICLE_LIFETIME,
    text
  }
}

/**
 * Нормализация времени для постоянной частоты кадров
 * @param {number} deltaTime - время между кадрами
 * @returns {number} нормализованное время
 */
export function normalizeDeltaTime(deltaTime) {
  return Math.min(60, deltaTime) / 16.67 // Нормализуем к 60 FPS
}

/**
 * Простое хеширование строки
 * @param {string} str - строка для хеширования
 * @returns {string} хеш
 */
export function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // Преобразование в 32-битное целое число
  }
  return String(hash)
}

/**
 * Форматирование числа с разделением тысяч
 * @param {number} num - число
 * @returns {string} отформатированное число
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('ru-RU').format(num)
}

/**
 * Ограничение значения между минимумом и максимумом
 * @param {number} value - значение
 * @param {number} min - минимум
 * @param {number} max - максимум
 * @returns {number} ограниченное значение
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Линейная интерполяция
 * @param {number} start - начальное значение
 * @param {number} end - конечное значение
 * @param {number} factor - коэффициент (0-1)
 * @returns {number} интерполированное значение
 */
export function lerp(start, end, factor) {
  return start + (end - start) * factor
}
