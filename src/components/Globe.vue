<template>
  <div class="globe-wrapper">
    <canvas ref="canvasRef" class="globe-canvas" />

    <!-- Tooltip hover -->
    <Transition name="tooltip">
      <div
        v-if="tooltip.visible"
        class="globe-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <span class="tooltip-flag">{{ tooltip.flag }}</span>
        <span class="tooltip-name">{{ tooltip.name }}</span>
        <span class="tooltip-badge" :class="'badge--' + tooltip.status">{{ tooltip.statusLabel }}</span>
      </div>
    </Transition>

    <!-- Loader GeoJSON -->
    <Transition name="fade">
      <div v-if="loading" class="globe-loader">
        <div class="loader-ring" />
        <span>{{ t('ui.globe.loader') }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGlobe } from '../composables/useGlobe'
import type { CountryData } from '../data/countries'
import { useI18n } from 'vue-i18n'
import { useCountries } from '../composables/useCountries'

const props = defineProps<{
  paused?: boolean
}>()

const emit = defineEmits<{
  (e: 'country-click', val: CountryData): void
}>()

const { t } = useI18n()
const { allCountries, statusColors, themeColors, getCountry } = useCountries()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)

const tooltip = ref({
  visible: false, x: 0, y: 0,
  flag: '', name: '', status: '', statusLabel: ''
})

let globe: any = null

onMounted(async () => {
  // Attendre que le canvas soit rendu
  await new Promise(r => setTimeout(r, 100))

  if (!canvasRef.value) return
  globe = useGlobe(canvasRef.value)

  // Préparer les maps de données pour le globe (DRY via useCountries)
  const statusByCode: Record<string, string> = {}
  const nameMap: Record<string, string> = {}
  Object.entries(allCountries.value).forEach(([code, data]) => {
    statusByCode[code] = data.status || 'nodata'
    if (data.alias) nameMap[data.alias] = code
  })

  globe.init(statusByCode, statusColors.value, themeColors.value, nameMap)

  globe.setOnCountryClick((code: string | null) => {
    if (!code) return
    const data = getCountry(code)
    emit('country-click', data || { code, name: code, status: 'nodata' } as CountryData)
    if (data && globe.focusCountry) globe.focusCountry(code)
  })

  globe.setOnCountryHover((code: string | null) => {
    if (!code) {
      tooltip.value.visible = false
      return
    }
    const countryData = getCountry(code)
    if (!countryData) {
      tooltip.value.visible = false
      return
    }

    const name = countryData.name || code
    const status = countryData.status || 'nodata'

    tooltip.value = {
      visible: true,
      x: 0, y: 0,
      flag: countryData.flag || '🌍',
      name: name,
      status: status,
      statusLabel: t(`status.${status}`) || ''
    }
  })

  // Suivre la position souris pour le tooltip
  if (canvasRef.value) {
    canvasRef.value.addEventListener('mousemove', (e: MouseEvent) => {
      if (tooltip.value.visible) {
        tooltip.value.x = e.clientX + 16
        tooltip.value.y = e.clientY - 10
      }
    })
  }

  // Simuler fin de chargement (GeoJSON ~500ms)
  setTimeout(() => { 
    loading.value = false
    if (globe) globe.setIsPaused(!!props.paused)
  }, 1800)
})

import { watch } from 'vue'

watch(() => props.paused, (newVal) => {
  if (loading.value) return 
  if (globe && globe.setIsPaused) {
    globe.setIsPaused(!!newVal)
  }
})

onUnmounted(() => {
  if (globe) globe.destroy()
})
</script>

<style scoped>
.globe-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.globe-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none; /* Empeche le zoom/pan natif du navigateur */
}

.globe-canvas:active {
  cursor: grabbing;
}

/* Tooltip */
.globe-tooltip {
  position: fixed;
  z-index: 100;
  pointer-events: none;
  background: var(--color-bg-backdrop);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border-dim);
  border-radius: 10px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Platform', sans-serif;
  box-shadow: 0 4px 20px var(--color-shadow-main);
}

.tooltip-flag { font-size: 1.2rem; }
.tooltip-name { color: var(--color-text-primary); font-size: 0.88rem; font-weight: 600; }

.tooltip-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
}

.badge--legal     { background: var(--color-border-dim); color: var(--color-legal); border: 1px solid var(--color-legal); }
.badge--tolerated { background: var(--color-bg-card); color: var(--color-tolerated); border: 1px solid var(--color-tolerated); }
.badge--prohibited{ background: var(--color-risk-low); color: var(--color-prohibited); border: 1px solid var(--color-legal); }

/* Loader */
.globe-loader {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--color-bg-backdrop);
  backdrop-filter: blur(8px);
  color: var(--color-text-secondary);
  font-family: 'Platform', sans-serif;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
}

.loader-ring {
  width: 44px; height: 44px;
  border: 3px solid var(--color-border-dim);
  border-top-color: var(--color-legal);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Transitions */
.tooltip-enter-active, .tooltip-leave-active { transition: opacity 0.15s, transform 0.15s; }
.tooltip-enter-from, .tooltip-leave-to { opacity: 0; transform: translateY(4px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
