<template>
  <div class="shop panel">
    <div class="mb-2">
      <strong>Магазин скинов</strong>
    </div>
    
    <div class="skins">
      <div 
        v-for="skin in skins" 
        :key="skin.id"
        class="skin-card"
        :class="{ selected: skinState.currentSkin === skin.id }"
      >
        <div 
          class="skin-preview" 
          :style="{ background: skin.color }"
        />
        
        <div class="skin-name">{{ skin.name }}</div>
        
        <div class="skin-price">
          {{ skin.price === 0 ? 'Бесплатно' : `${skin.price} 💎` }}
        </div>
        
        <button 
          @click="handleSkinAction(skin)"
          :disabled="isProcessing"
          class="skin-button"
        >
          {{ getSkinButtonText(skin) }}
        </button>
      </div>
    </div>
    
    <div class="shop-hint small mt-2">
      Скины применяются сразу и сохраняются в аккаунте.
    </div>
    
    <div 
      v-if="shopMessage" 
      class="message mt-2"
      :class="shopMessageType"
    >
      {{ shopMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { skins } from '../stores/gameStore.js'
import { authState, authActions } from '../stores/authStore.js'
import { skinState, skinActions } from '../stores/skinStore.js'

const isProcessing = ref(false)
const shopMessage = ref('')
const shopMessageType = ref('info')

const ownedSkins = computed(() => skinActions.getOwnedSkins())

function getSkinButtonText(skin) {
  if (ownedSkins.value.includes(skin.id)) {
    return skinState.currentSkin === skin.id ? 'Выбран' : 'Применить'
  }
  return 'Купить'
}

async function handleSkinAction(skin) {
  if (isProcessing.value) return
  
  isProcessing.value = true
  
  try {
    if (ownedSkins.value.includes(skin.id)) {
      // Применить скин
      skinActions.applySkin(skin.id)
      showMessage(`Скин "${skin.name}" применен!`, 'success')
    } else {
      // Купить скин
      if (!authState.currentUser) {
        showMessage('Сначала войдите в аккаунт', 'error')
        return
      }
      
      const result = skinActions.buySkin(skin.id)
      showMessage(result.message, result.success ? 'success' : 'error')
    }
  } finally {
    isProcessing.value = false
  }
}

function showMessage(message, type = 'info') {
  shopMessage.value = message
  shopMessageType.value = type
  
  setTimeout(() => {
    shopMessage.value = ''
  }, 3000)
}

// Загружаем скин пользователя при входе в аккаунт
watch(() => authState.currentUser, (newUser) => {
  if (newUser) {
    skinActions.loadUserSkin()
  } else {
    skinActions.applySkin('default')
  }
}, { immediate: true })
</script>

<style scoped>
.shop {
  min-width: 400px;
}

.skins {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 12px 0;
}

.skin-card {
  background: rgba(255, 255, 255, 0.02);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  width: 110px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.skin-card:hover {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

.skin-card.selected {
  border-color: #6fa8ff;
  background: rgba(111, 168, 255, 0.1);
}

.skin-preview {
  width: 48px;
  height: 32px;
  border-radius: 6px;
  margin: 0 auto 8px;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.skin-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

.skin-price {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.skin-button {
  width: 100%;
  padding: 6px 8px;
  font-size: 12px;
  border-radius: 4px;
}

.skin-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.shop-hint {
  text-align: center;
  opacity: 0.7;
  line-height: 1.3;
}

.message {
  padding: 8px;
  border-radius: 4px;
  text-align: center;
  font-size: 13px;
}

.message.success {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.message.error {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.message.info {
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
}

@media (max-width: 768px) {
  .shop {
    min-width: auto;
  }
  
  .skins {
    justify-content: center;
  }
}
</style>
