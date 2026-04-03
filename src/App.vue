<template>
  <div class="app" :style="rootStyles">
    <!-- Globe plein écran -->
    <Globe @country-click="openModal" :paused="!!selectedCountry" />

    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <NormlLogo class="header-logo" alt="NORML France" />
        <div class="header-separator"></div>
        <h1 class="header-title">{{ t('ui.header.title') }}</h1>
      </div>
    </header>

    <!-- Légende positionnée en bas à gauche -->
    <div class="legend-container">
      <Legend />
    </div>

    <!-- Modal pays -->
    <CountryModal :country="selectedCountry" @close="closeModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import Globe from './components/Globe.vue'
import CountryModal from './components/CountryModal.vue'
import Legend from './components/Legend.vue'
import NormlLogo from './components/NormlLogo.vue'
import type { CountryData } from './data/countries'
import { useCountries } from './composables/useCountries'

const { t } = useI18n()
const { statusColors, themeColors } = useCountries()
const selectedCountry = ref<CountryData | null>(null)

// Injecter les couleurs dans le style CSS pour le DRY
const rootStyles = computed(() => {
  const colors = statusColors.value || {}
  const theme = themeColors.value || {}
  const styles: Record<string, string> = {
    '--color-legal': colors['legal'] || '#2E8A42',
    '--color-tolerated': colors['tolerated'] || '#DBE3D6',
    '--color-prohibited': colors['prohibited'] || '#0D1A17',
    '--color-nodata': colors['nodata'] || '#0D1A17'
  }
  
  // Ajouter toutes les couleurs de thème
  Object.entries(theme).forEach(([key, val]) => {
    styles[`--color-${key.replace(/_/g, '-')}`] = val
  })
  
  return styles
})

// Synchroniser les variables CSS globales
watchEffect(() => {
  const styles = rootStyles.value
  Object.entries(styles).forEach(([key, val]) => {
    document.documentElement.style.setProperty(key, val)
  })
})

function openModal(countryData: CountryData) {
  selectedCountry.value = countryData
}

function closeModal() {
  selectedCountry.value = null
}
</script>

<style scoped>
.app {
  position: relative;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  background: radial-gradient(ellipse at 30% 40%, var(--color-legal-glow-subtle) 0%, var(--color-bg-main) 55%, #020806 100%);
}

/* Header */
.app-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  background: linear-gradient(to bottom, 
    rgba(5, 13, 10, 0.7) 0%, 
    rgba(5, 13, 10, 0.2) 60%, 
    transparent 100%);
  pointer-events: none;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  pointer-events: none;
}

.header-logo {
  height: 32px; /* Hauteur fixe pour alignement propre */
  width: auto;
  filter: drop-shadow(0 0 10px rgba(46, 138, 66, 0.2));
}

.header-separator {
  width: 1px;
  height: 24px;
  background: linear-gradient(to bottom, transparent, var(--color-border-soft), transparent);
}

.header-title {
  margin: 0;
  font-family: 'Platform', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
  line-height: 1;
}

/* Legend */
.legend-container {
  position: absolute;
  bottom: 24px;
  left: 16px;
  z-index: 50;
}

@media (max-width: 767px) {
  .app-header { padding: 12px 16px; }
  .header-logo { height: 28px; }
  .header-title { font-size: 0.95rem; }
  .legend-container { bottom: 12px; left: 12px; }
}

@media (min-width: 768px) {
  .app-header { padding: 24px 40px; }
  .header-logo { height: 52px; }
  .header-title { font-size: 1.9rem; }
  .header-separator { height: 40px; }
  .legend-container { bottom: 32px; left: 24px; }
}
</style>
