/**
 * Константы игры
 */

export const GAME_CONFIG = {
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 260,
  GROUND_HEIGHT: 40,
  
  // Физика
  GRAVITY: 0.6,
  JUMP_FORCE: -12,
  
  // Скорость
  INITIAL_SPEED: 4,
  SPEED_INCREMENT: 0.0009,
  
  // Спавн препятствий
  INITIAL_SPAWN_INTERVAL: 90,
  MIN_SPAWN_INTERVAL: 60,
  MAX_SPAWN_INTERVAL: 140,
  
  // Игрок
  PLAYER: {
    X: 80,
    WIDTH: 44,
    HEIGHT: 44,
    DUCK_HEIGHT_RATIO: 0.55
  },
  
  // Препятствия
  OBSTACLES: {
    MIN_WIDTH: 20,
    MAX_WIDTH: 50,
    MIN_HEIGHT: 30,
    MAX_HEIGHT: 60,
    BIRD_HEIGHT: 24,
    BIRD_Y_VARIATION: 60
  },
  
  // Очки
  OBSTACLE_POINTS: 10,
  CONTINUOUS_POINTS_RATE: 0.05,
  
  // Эффекты
  GAME_OVER_PARTICLES: 30,
  PARTICLE_LIFETIME: 80
}

export const STORAGE_KEYS = {
  USERS: 'dino_users',
  BEST_SCORE: 'dino_best'
}

export const MESSAGE_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error'
}

export const OBSTACLE_TYPES = {
  CACTUS: 'cactus',
  BIRD: 'bird',
  ROCK: 'rock'
}
