import { reactive } from 'vue'
import { skins } from './gameStore.js'
import { authState, authActions } from './authStore.js'

// Состояние скинов
const skinState = reactive({
  currentSkin: 'default'
})

// Методы работы со скинами
export const skinActions = {
  applySkin(skinId) {
    skinState.currentSkin = skinId
    
    // Сохраняем выбор в аккаунте пользователя
    if (authState.currentUser) {
      const userData = authActions.getUserData()
      if (userData) {
        userData.selected = skinId
        authActions.saveUserData(userData)
      }
    }
  },

  buySkin(skinId) {
    if (!authState.currentUser) {
      return { success: false, message: 'Сначала войдите в аккаунт' }
    }

    const userData = authActions.getUserData()
    if (!userData) {
      return { success: false, message: 'Ошибка загрузки данных пользователя' }
    }

    const skin = skins.find(s => s.id === skinId)
    if (!skin) {
      return { success: false, message: 'Скин не найден' }
    }

    // Проверяем, не куплен ли уже скин
    if (userData.purchased.includes(skinId)) {
      return { success: false, message: 'Скин уже куплен' }
    }

    // Проверяем достаточность средств
    if (userData.coins < skin.price) {
      return { success: false, message: 'Недостаточно монет' }
    }

    // Покупаем скин
    userData.coins -= skin.price
    userData.purchased.push(skinId)
    userData.selected = skinId
    authActions.saveUserData(userData)

    // Применяем скин
    this.applySkin(skinId)

    return { success: true, message: 'Скин успешно куплен!' }
  },

  getOwnedSkins() {
    if (!authState.currentUser) {
      return ['default']
    }

    const userData = authActions.getUserData()
    return userData ? userData.purchased : ['default']
  },

  loadUserSkin() {
    if (!authState.currentUser) {
      skinState.currentSkin = 'default'
      return
    }

    const userData = authActions.getUserData()
    if (userData && userData.selected) {
      skinState.currentSkin = userData.selected
    } else {
      skinState.currentSkin = 'default'
    }
  },

  getCurrentSkinData() {
    return skins.find(s => s.id === skinState.currentSkin) || skins[0]
  }
}

export { skinState }
