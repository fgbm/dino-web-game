/**
 * Утилиты для работы с localStorage
 */

export const storage = {
  /**
   * Получить значение из localStorage с проверкой на ошибки
   * @param {string} key - ключ
   * @param {*} defaultValue - значение по умолчанию
   * @returns {*}
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn(`Ошибка при чтении localStorage для ключа "${key}":`, error)
      return defaultValue
    }
  },

  /**
   * Сохранить значение в localStorage с проверкой на ошибки
   * @param {string} key - ключ
   * @param {*} value - значение
   * @returns {boolean} - успешность операции
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn(`Ошибка при записи в localStorage для ключа "${key}":`, error)
      return false
    }
  },

  /**
   * Удалить значение из localStorage
   * @param {string} key - ключ
   * @returns {boolean} - успешность операции
   */
  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Ошибка при удалении из localStorage для ключа "${key}":`, error)
      return false
    }
  },

  /**
   * Проверить доступность localStorage
   * @returns {boolean}
   */
  isAvailable() {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }
}
