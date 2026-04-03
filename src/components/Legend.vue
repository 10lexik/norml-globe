<template>
  <div class="legend">
    <!-- Compteurs -->
    <div class="stats-row">
      <div class="stat-item stat--legal">
        <span class="stat-count">{{ stats.legal }}</span>
        <span class="stat-label">{{ t('ui.legend.stats.legal') }}</span>
      </div>
      <div class="stat-divider" />
      <div class="stat-item stat--tolerated">
        <span class="stat-count">{{ stats.tolerated }}</span>
        <span class="stat-label">{{ t('ui.legend.stats.tolerated') }}</span>
      </div>
      <div class="stat-divider" />
      <div class="stat-item stat--prohibited">
        <span class="stat-count">{{ stats.prohibited }}</span>
        <span class="stat-label">{{ t('ui.legend.stats.prohibited') }}</span>
      </div>
    </div>

    <!-- Légende couleurs -->
    <div class="legend-items">
      <div class="legend-item">
        <span class="legend-swatch swatch--legal" />
        <span class="legend-text">{{ t('ui.legend.items.legal') }}</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch swatch--tolerated" />
        <span class="legend-text">{{ t('ui.legend.items.tolerated') }}</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch swatch--prohibited" />
        <span class="legend-text">{{ t('ui.legend.items.prohibited') }}</span>
      </div>
    </div>

    <!-- Indication interaction -->
    <p class="legend-hint">
      <span class="hint-icon">⬆️</span>
      {{ t('ui.legend.hint') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useCountries } from '../composables/useCountries'

const { t } = useI18n()
const { stats } = useCountries()
</script>

<style scoped>
.legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--color-bg-backdrop);
  backdrop-filter: blur(14px);
  border: 1.5px solid var(--color-legal); /* Bordure marque dominante */
  border-radius: 16px;
  padding: 14px 16px;
  width: max-content;
  max-width: calc(100vw - 32px);
  box-shadow: 0 4px 24px var(--color-shadow-main);
}

@media (max-width: 767px) {
  .legend {
    padding: 10px 12px;
    gap: 8px;
    border-radius: 12px;
  }

  .stat-count {
    font-size: 1.1rem;
  }

  .stat-label {
    font-size: 0.55rem;
  }

  .legend-items {
    gap: 4px;
  }

  .legend-text {
    font-size: 0.68rem;
  }

  .legend-hint {
    display: none;
  }

  /* Hide hint on mobile to save vertical space */
}

/* Compteurs */
.stats-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.stat-count {
  font-family: 'Platform', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
}

.stat--legal .stat-count {
  color: var(--color-legal);
}

.stat--tolerated .stat-count {
  color: var(--color-tolerated);
}

.stat--prohibited .stat-count {
  color: var(--color-prohibited);
  background: var(--color-risk-low); /* Lighter green for high contrast with dark text */
  padding: 0 6px;
  border-radius: 4px;
}

.stat-label {
  font-family: 'Platform', sans-serif;
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-dim);
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: var(--color-border-soft);
  margin: 0 4px;
}

/* Légende */
.legend-items {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.swatch--legal {
  background: var(--color-legal);
  box-shadow: 0 0 6px var(--color-legal-glow);
}

.swatch--tolerated {
  background: var(--color-tolerated);
}

.swatch--prohibited {
  background: var(--color-prohibited);
  border: 1px solid var(--color-border-dim);
}

.legend-text {
  font-family: 'Platform', sans-serif;
  font-size: 0.74rem;
  color: var(--color-text-secondary);
}

/* Hint */
.legend-hint {
  font-family: 'Platform', sans-serif;
  font-size: 0.7rem;
  color: var(--color-text-dim);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  border-top: 1px solid var(--color-border-soft);
  padding-top: 10px;
}

.hint-icon {
  font-size: 0.8rem;
}
</style>
