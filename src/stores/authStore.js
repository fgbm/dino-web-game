import { reactive } from 'vue'

// Простая система аутентификации на основе localStorage
const authState = reactive({
  currentUser: null,
  message: '',
  messageType: 'info' // 'info', 'success', 'error'
})

// Утилиты для работы с пользователями
const userUtils = {
  loadUsers() {
    return JSON.parse(localStorage.getItem('dino_users') || '{}')
  },

  saveUsers(users) {
    localStorage.setItem('dino_users', JSON.stringify(users))
  },

  hashPassword(password) {
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      hash = (hash << 5) - hash + password.charCodeAt(i)
      hash |= 0 // Преобразование в 32-битное целое число
    }
    return String(hash)
  }
}

// Методы аутентификации
export const authActions = {
  registerUser(username, password) {
    if (!username.trim()) {
      authState.message = 'Введите имя пользователя'
      authState.messageType = 'error'
      return false
    }

    if (!password) {
      authState.message = 'Введите пароль'
      authState.messageType = 'error'
      return false
    }

    const users = userUtils.loadUsers()
    
    if (users[username]) {
      authState.message = 'Пользователь уже существует'
      authState.messageType = 'error'
      return false
    }

    users[username] = {
      pwd: userUtils.hashPassword(password),
      coins: 0,
      purchased: ['default'],
      selected: 'default',
      best: 0,
      registrationDate: new Date().toISOString(),
      totalTimePlayed: 0,
      recentGames: [] // Массив для хранения истории игр
    }

    userUtils.saveUsers(users)
    this.setAuth(username)
    authState.message = 'Регистрация успешна!'
    authState.messageType = 'success'
    return true
  },

  loginUser(username, password) {
    if (!username.trim()) {
      authState.message = 'Введите имя пользователя'
      authState.messageType = 'error'
      return false
    }

    const users = userUtils.loadUsers()
    
    if (!users[username]) {
      authState.message = 'Пользователь не найден'
      authState.messageType = 'error'
      return false
    }

    if (users[username].pwd !== userUtils.hashPassword(password)) {
      authState.message = 'Неверный пароль'
      authState.messageType = 'error'
      return false
    }

    this.setAuth(username)
    authState.message = 'Вход выполнен успешно!'
    authState.messageType = 'success'
    return true
  },

  setAuth(username) {
    authState.currentUser = username
  },

  logout() {
    authState.currentUser = null
    authState.message = 'Вы вышли из аккаунта'
    authState.messageType = 'info'
  },

  getUserData() {
    if (!authState.currentUser) return null
    const users = userUtils.loadUsers()
    return users[authState.currentUser]
  },

  saveUserData(data) {
    if (!authState.currentUser) return
    const users = userUtils.loadUsers()
    users[authState.currentUser] = data
    userUtils.saveUsers(users)
  },

  addCoins(amount) {
    const userData = this.getUserData()
    if (userData) {
      userData.coins = (userData.coins || 0) + amount
      this.saveUserData(userData)
    }
  },

  updateBest(score) {
    const userData = this.getUserData()
    if (userData && score > (userData.best || 0)) {
      userData.best = score
      this.saveUserData(userData)
      authState.message = 'Новый личный рекорд!'
      authState.messageType = 'success'
      return true
    }
    return false
  },

  // Новая функция для сохранения результата игры
  saveGameResult(score, duration = 0) {
    const userData = this.getUserData()
    if (!userData) return

    // Добавляем новую запись в историю игр
    const gameRecord = {
      date: new Date().toISOString(),
      score: score,
      duration: duration // продолжительность игры в секундах
    }

    // Добавляем в начало массива (новые игры первыми)
    userData.recentGames = [gameRecord, ...(userData.recentGames || [])].slice(0, 20) // Ограничиваем 20 последними играми
    
    // Обновляем общее время игры
    userData.totalTimePlayed = (userData.totalTimePlayed || 0) + duration
    
    this.saveUserData(userData)
  },

  clearMessage() {
    authState.message = ''
  }
}

export { authState }
