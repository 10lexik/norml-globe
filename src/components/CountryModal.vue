<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="country" class="modal-backdrop" @click.self="close" />
    </Transition>

    <Transition name="modal-slide">
      <div v-if="country" class="modal-sheet" role="dialog" :aria-label="tC('name') || country.code">
        <!-- Handle mobile -->
        <div class="modal-handle" @click="close" />

        <!-- Scroll container -->
        <div class="modal-scroll">
          <!-- ── Header ── -->
          <div class="modal-header">
            <div class="header-left">
              <span class="country-flag">{{ flag }}</span>
              <div class="country-meta">
                <h2 class="country-name">{{ tC('name') || country?.code }}</h2>
                <p class="country-subtitle">{{ subtitle }}</p>
              </div>
            </div>
            <button class="modal-close" @click="close" :aria-label="t('ui.modal.close')">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Status and Risk Level -->
          <div class="status-row">
            <span class="status-badge" :class="'status--' + effectiveStatus">
              <span class="status-dot" />
              {{ t('status.' + effectiveStatus) }}
            </span>
            
            <span v-if="tC('thc_status')" class="status-badge" :class="'status--' + tC('thc_status')">
              THC: {{ t('status.' + tC('thc_status')) }}
            </span>

            <span v-if="tC('cbd_status')" class="status-badge" :class="'status--' + tC('cbd_status')">
              CBD: {{ t('status.' + tC('cbd_status')) }}
            </span>

            <!-- Risk Level Gauge (Legacy support) -->
            <span v-if="tC('risks.level')" class="risk-badge" :class="'risk--' + tC('risks.level')">
              {{ t('ui.modal.risk_label') }} {{ tC('risks.level').toUpperCase() }}
            </span>

            <span v-if="tC('medical')" class="cbd-badge">
              {{ t('ui.modal.medical_badge') }}
            </span>
          </div>

          <!-- ── No data ── -->
          <template v-if="isNoData">
            <div class="nodata-block">
              <div class="nodata-icon">⚠️</div>
              <p class="nodata-title">{{ t('ui.modal.no_data.title') }}</p>
              <p class="nodata-text">
                {{ t('ui.modal.no_data.text') }}
              </p>
              <a
                :href="`https://fr.wikipedia.org/wiki/Cannabis`"
                target="_blank" rel="noopener"
                class="wiki-link wiki-link--contribute"
              >
                {{ t('ui.modal.no_data.link') }}
              </a>
            </div>
          </template>

          <!-- ── Pays avec données ── -->
          <template v-else>

            <!-- Contexte prohibition -->
            <div v-if="tC('prohibitionContext')" class="section">
              <div class="section-bar" />
              <p class="narrative-text">{{ tC('prohibitionContext') }}</p>
            </div>

            <!-- ── Histoire (NORML Expert) ── -->
            <div v-if="country.history" class="section history-section">
              <h3 class="section-title">{{ t('ui.modal.sections.history') }}</h3>
              <div class="history-grid">
                <div v-if="country.history.prohibition" class="history-item">
                  <span class="history-label">{{ t('ui.modal.history.prohibition') }}</span>
                  <p class="history-text">{{ country.history.prohibition }}</p>
                </div>
                <div v-if="country.history.evolution" class="history-item">
                  <span class="history-label">{{ t('ui.modal.history.evolution') }}</span>
                  <p class="history-text">{{ country.history.evolution }}</p>
                </div>
                <div v-if="country.history.context" class="history-item history-item--full">
                  <span class="history-label">{{ t('ui.modal.history.context') }}</span>
                  <p class="history-text">{{ country.history.context }}</p>
                </div>
              </div>
            </div>

            <!-- Legacy Timeline (Fallback) -->
            <div class="timeline-arc" v-else-if="tC('prohibitionYear') || tC('legalizationYear')">
              <div class="arc-container">
                <div class="arc-start" v-if="tC('prohibitionYear')">
                  <span class="arc-label">{{ t('ui.modal.timeline.prohibition') }}</span>
                  <span class="arc-year arc-year--prohibited">{{ tC('prohibitionYear') }}</span>
                </div>
                
                <div class="arc-arrow" v-if="tC('prohibitionYear') && tC('legalizationYear')">➔</div>
                <div class="arc-arrow arc-arrow--ongoing" v-else-if="tC('prohibitionYear') && !tC('legalizationYear')">➔</div>

                <div class="arc-end">
                  <template v-if="tC('legalizationYear')">
                    <span class="arc-label">{{ t('ui.modal.timeline.legalization') }}</span>
                    <span class="arc-year arc-year--legal">{{ tC('legalizationYear') }}</span>
                  </template>
                  <template v-else-if="tC('prohibitionYear')">
                    <span class="arc-label">{{ t('ui.modal.timeline.status') }}</span>
                    <span class="arc-year arc-year--ongoing">{{ t('ui.modal.timeline.today') }}</span>
                  </template>
                </div>
              </div>
              <div v-if="tC('prohibitionLaw') || tC('legalizationLaw')" class="arc-laws">
                <span v-if="tC('prohibitionLaw')" class="tl-law">🚫 {{ tC('prohibitionLaw') }}</span>
                <span v-if="tC('legalizationLaw')" class="tl-law">✅ {{ tC('legalizationLaw') }}</span>
              </div>
            </div>

            <!-- Contexte légalisation -->
            <div v-if="tC('legalizationContext')" class="section legal-context">
              <p class="narrative-text">{{ tC('legalizationContext') }}</p>
            </div>

            <!-- ── Analyse NORML Expert ── -->
            <div v-if="country.norml_expert" class="section expert-section">
              <h3 class="section-title">{{ t('ui.modal.sections.expert') }}</h3>
              
              <div v-if="country.norml_expert.summary" class="expert-verdict">
                <span class="verdict-icon">⚖️</span>
                <p class="verdict-text">{{ country.norml_expert.summary }}</p>
              </div>

              <div v-if="country.norml_expert.risks" class="expert-risks-box">
                <span class="risks-label">🚨 {{ t('ui.modal.sections.risks') }}</span>
                <p class="risks-content">{{ country.norml_expert.risks }}</p>
              </div>

              <div v-if="country.norml_expert.analysis" class="analysis-grid">
                <div v-if="country.norml_expert.analysis.social" class="analysis-item">
                  <span class="analysis-label">{{ t('ui.modal.analysis.social') }}</span>
                  <p class="analysis-text">{{ country.norml_expert.analysis.social }}</p>
                </div>
                <div v-if="country.norml_expert.analysis.racial" class="analysis-item">
                  <span class="analysis-label">{{ t('ui.modal.analysis.racial') }}</span>
                  <p class="analysis-text">{{ country.norml_expert.analysis.racial }}</p>
                </div>
                <div v-if="country.norml_expert.analysis.economic" class="analysis-item">
                  <span class="analysis-label">{{ t('ui.modal.analysis.economic') }}</span>
                  <p class="analysis-text">{{ country.norml_expert.analysis.economic }}</p>
                </div>
              </div>
            </div>

            <!-- Legacy Risques (Fallback) -->
            <div v-else class="section risks-section">
              <h3 class="section-title">{{ t('ui.modal.sections.risks') }}</h3>
              <div class="penalties-grid">
                <div v-if="tC('risks.personal_use')" class="penalty-item">
                  <span class="penalty-icon">⚖️</span>
                  <span class="penalty-type">{{ t('ui.modal.sections.usage') }}</span>
                  <span class="penalty-desc">{{ tC('risks.personal_use') }}</span>
                </div>
                <div v-if="tC('risks.trafficking')" class="penalty-item penalty-item--heavy">
                  <span class="penalty-icon">🚨</span>
                  <span class="penalty-type">{{ t('ui.modal.sections.trafficking') }}</span>
                  <span class="penalty-desc">{{ tC('risks.trafficking') }}</span>
                </div>
                <div v-if="tC('medical')" class="penalty-item">
                  <span class="penalty-icon">🏥</span>
                  <span class="penalty-type">{{ t('ui.modal.sections.medical') }}</span>
                  <span class="penalty-desc">{{ tC('medical') }}</span>
                </div>
              </div>
            </div>

            <!-- Highlights (stats) -->
            <div v-if="tCA('stats').length" class="section">
              <h3 class="section-title">{{ t('ui.modal.sections.highlights') }}</h3>
              <div class="highlights-grid" ref="highlightsRef">
                <div
                  v-for="(s, i) in tCA('stats')"
                  :key="i"
                  class="highlight-card"
                >
                  <span class="hl-label">{{ s }}</span>
                </div>
              </div>
            </div>

            <!-- ── Appel à l'action (Configurable via JSON) ── -->
            <div v-if="tC('show_cta')" class="section norml-cta">
              <div class="cta-card">
                <div class="cta-icon">📣</div>
                <div class="cta-content">
                  <h3 class="cta-title">{{ t('ui.modal.cta.title') }}</h3>
                  <p class="cta-text">{{ t('ui.modal.cta.text') }}</p>
                  <div class="cta-buttons">
                    <a href="https://norml.fr/don/" target="_blank" rel="noopener" class="btn btn--primary">{{ t('ui.modal.cta.support') }}</a>
                    <a href="https://norml.fr/adherer/" target="_blank" rel="noopener" class="btn btn--secondary">{{ t('ui.modal.cta.join') }}</a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Old CBD Section replaced by Risks Grid -->

            <!-- Wikipedia extrait -->
            <div class="section wiki-section">
              <div class="wiki-header">
                <span class="wiki-icon">📖</span>
                <h3 class="section-title">{{ t('ui.modal.sections.wikipedia') }}</h3>
              </div>
              <Transition name="fade">
                <div v-if="wikiLoading" class="wiki-loading">
                  <div class="wiki-spinner" /><span>{{ t('ui.modal.wiki.loading') }}</span>
                </div>
                <div v-else-if="wikiExtract" class="wiki-extract">
                  <p>{{ wikiExtract }}</p>
                  <a :href="wikiUrl" target="_blank" rel="noopener" class="wiki-link">
                    {{ t('ui.modal.wiki.full_article') }}
                  </a>
                </div>
                <div v-else class="wiki-unavailable">
                  <a
                    :href="`https://en.wikipedia.org/wiki/${tC('wikipediaSlug') || 'Cannabis'}`"
                    target="_blank" rel="noopener" class="wiki-link"
                  >
                    {{ t('ui.modal.wiki.view_wiki') }}
                  </a>
                </div>
              </Transition>
            </div>

          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { gsap } from 'gsap'
import { useI18n } from 'vue-i18n'
import type { CountryData } from '../data/countries'
import { useCountries } from '../composables/useCountries'

const props = defineProps<{
  country?: CountryData | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const { tCountry, tCountryArr, wikiConfig } = useCountries()

// Helpers locaux pour alléger le template et éviter les erreurs d'arguments
const tC = (field: string) => tCountry(props.country?.code, field)
const tCA = (field: string) => tCountryArr(props.country?.code, field)

const highlightsRef = ref<HTMLElement | null>(null)
const wikiLoading = ref(false)
const wikiExtract = ref('')
const wikiUrl = ref('')

// Drapeaux emoji - Désormais géré par pays dans countries.json
const flag = computed(() => {
  if (!props.country?.code) return '🌍'
  return tC('flag') || '🌍'
})

const effectiveStatus = computed(() => {
  if (!props.country) return 'nodata'
  return tC('status') || 'nodata'
})



const isNoData = computed(() => {
  // Un pays a des données s'il a le nouveau schéma Expert
  const hasExpertData = props.country?.history || props.country?.norml_expert
  // ... ou s'il a encore l'ancien schéma (compatibilité)
  const hasLegacyData = tC('prohibitionYear') || tC('legalizationYear') || tC('prohibitionContext')
  
  // On n'affiche le bloc "No Data" que si aucune donnée n'est trouvée 
  // ET que le pays n'est pas "legal" (car pour les pays légaux on affiche toujours le modal)
  return !hasExpertData && !hasLegacyData && effectiveStatus.value !== 'legal'
})

const subtitle = computed(() => {
  if (!props.country) return ''
  const s = tC('status') || 'prohibited'
  const cbd = tC('cbd_status') || 'undefined'
  const key = `ui.modal.subtitles.${s}_cbd_${cbd}`
  return t(key)
})

// Fetch Wikipedia fr avec recherche de contexte "Cannabis"
async function fetchWikipedia() {
  if (!props.country?.code) return
  
  const config = wikiConfig.value
  const countryName = tC('name')
  wikiLoading.value = true
  wikiExtract.value = ''
  wikiUrl.value = ''
  
  try {
    let title: string | null = tC('wikipediaSlug')
    let summaryData = null

    // 1. Si on a un slug, on vérifie son existence via Action API (évite le 404 console)
    if (title) {
      const checkUrl = `${config.baseUrl}/w/api.php?action=query&titles=${encodeURIComponent(title)}&format=json&origin=*`
      const checkRes = await fetch(checkUrl)
      const checkData = await checkRes.json()
      
      const pages = checkData.query?.pages || {}
      const pageId = Object.keys(pages)[0]
      const exists = pageId && pageId !== '-1'

      if (exists) {
        const summaryRes = await fetch(
          `${config.restApiUrl}/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
          { headers: { 'Accept': 'application/json' } }
        )
        if (summaryRes.ok) summaryData = await summaryRes.json()
      } else {
        title = null // Déclenche la recherche ci-dessous
      }
    }
    
    // 2. Étape de recherche : Si pas de title ou slug inexistant
    if (!title) {
      const searchQuery = `${config.searchTerm} ${countryName}`
      const searchUrl = `${config.baseUrl}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`
      
      const searchRes = await fetch(searchUrl)
      const searchData = await searchRes.json()
      
      if (searchData.query?.search?.length > 0) {
        const topResult = searchData.query.search[0]
        const topTitle = topResult.title
        const isMatch = config.filterKeywords.some(k => topTitle.toLowerCase().includes(k.toLowerCase()))
        
        if (isMatch) {
          title = topTitle
          const summaryRes = await fetch(
            `${config.restApiUrl}/page/summary/${encodeURIComponent(topTitle.replace(/ /g, '_'))}`,
            { headers: { 'Accept': 'application/json' } }
          )
          if (summaryRes.ok) summaryData = await summaryRes.json()
        }
      }
    }
    
    // 3. Fallback final si toujours rien
    if (!summaryData) {
      title = config.fallbackTitle
      const summaryRes = await fetch(
        `${config.restApiUrl}/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        { headers: { 'Accept': 'application/json' } }
      )
      if (summaryRes.ok) summaryData = await summaryRes.json()
    }

    if (summaryData) {
      const raw = summaryData.extract || ''
      wikiExtract.value = raw.length > 400 ? raw.slice(0, 397) + '…' : raw
      wikiUrl.value = summaryData.content_urls?.desktop?.page || `${config.baseUrl}/wiki/${title || config.fallbackTitle}`
    } else {
      wikiUrl.value = `${config.baseUrl}/wiki/${config.fallbackTitle}`
    }

  } catch (err) {
    console.warn('Wikipedia Fetch Error:', err)
    wikiExtract.value = ''
    wikiUrl.value = `${config.baseUrl}/wiki/${config.fallbackTitle}`
  } finally {
    wikiLoading.value = false
  }
}

// Animer les cards highlights avec GSAP
function animateHighlights() {
  if (!highlightsRef.value) return
  const cards = highlightsRef.value.querySelectorAll('.highlight-card')
  if (!cards.length) return
  gsap.fromTo(cards,
    { opacity: 0, y: 16, scale: 0.92 },
    { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.3 }
  )
}

function close() { emit('close') }

watch(() => props.country, (val) => {
  if (val) {
    wikiExtract.value = ''
    fetchWikipedia()
    // Animer highlights après transition modal
    setTimeout(animateHighlights, 400)
  }
})
</script>

<style scoped>
/* ── Sheet mobile-first ─────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--color-bg-backdrop);
  backdrop-filter: blur(4px);
  z-index: 200;
}

.modal-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 201;
  max-height: 90dvh;
  background: linear-gradient(160deg, var(--color-bg-sheet) 0%, var(--color-bg-main) 100%);
  border-top: 1px solid var(--color-border-dim);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 40px var(--color-shadow-heavy);
  overflow: hidden;
}

/* Desktop : modal centré */
@media (min-width: 768px) {
  .modal-sheet {
    bottom: auto;
    top: 50%;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
    width: min(560px, 95vw);
    max-height: 85vh;
    border-radius: 20px;
    border: 1px solid var(--color-border-dim);
  }
}

.modal-handle {
  width: 40px;
  height: 4px;
  background: var(--color-legal); /* Marque dominante */
  border-radius: 4px;
  margin: 12px auto 4px;
  cursor: pointer;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .modal-handle { display: none; }
}

.modal-scroll {
  overflow-y: auto;
  flex: 1;
  padding: 16px 20px 32px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 768px) {
  .modal-scroll { padding: 24px 28px 36px; }
}

/* ── Header ─────────────────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.country-flag { font-size: 2.2rem; line-height: 1; }

.country-name {
  font-family: 'Platform', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 2px;
}

.country-subtitle {
  font-family: 'Platform', sans-serif;
  font-size: 0.78rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.modal-close {
  background: var(--color-ui-close-bg);
  border: 1px solid var(--color-border-soft);
  border-radius: 50%;
  color: var(--color-text-secondary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
}
.modal-close:hover { background: var(--color-ui-close-hover); color: var(--color-text-primary); }

/* ── Status badges ──────────────────────────────────────── */
.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-family: 'Platform', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.status--legal     { background: var(--color-legal-glow-subtle); color: var(--color-legal); border: 1px solid var(--color-legal); }
.status--tolerated { background: var(--color-bg-card); color: var(--color-tolerated); border: 1px solid var(--color-tolerated); }
.status--prohibited{ background: var(--color-risk-low); color: var(--color-prohibited); border: 1.5px solid var(--color-legal); }
.status--nodata    { background: var(--color-bg-main);   color: var(--color-nodata); border: 1px solid var(--color-border-dim); }

.cbd-badge {
  font-family: 'Platform', sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  background: var(--color-cbd-bg);
  color: var(--color-cbd-accent);
  border: 1px solid var(--color-border-dim);
}

.risk-badge {
  font-family: 'Platform', sans-serif;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}
.risk--none   { background: var(--color-legal); color: #fff; }
.risk--low    { background: var(--color-risk-low); color: #050d0a; }
.risk--medium { background: var(--color-risk-medium); color: #050d0a; }
.risk--high   { background: var(--color-risk-high); color: #fff; }
.risk--deadly { background: var(--color-risk-deadly); color: var(--color-risk-high); border: 1px solid var(--color-risk-high); }

/* ── No data ─────────────────────────────────────────────── */
.nodata-block {
  text-align: center;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.nodata-icon { font-size: 2.4rem; }
.nodata-title {
  font-family: 'Platform', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0;
}
.nodata-text {
  font-family: 'Platform', sans-serif;
  font-size: 0.84rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  max-width: 300px;
  margin: 0;
}

/* ── Sections ────────────────────────────────────────────── */
.section {
  margin-bottom: 24px;
}

.section-bar {
  width: 32px;
  height: 2px;
  background: linear-gradient(90deg, var(--color-legal), transparent);
  border-radius: 2px;
  margin-bottom: 10px;
}

.section-title {
  font-family: 'Platform', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  margin: 0 0 12px;
}

.narrative-text {
  font-family: 'Platform', sans-serif;
  font-size: 0.88rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin: 0;
}

.legal-context .narrative-text {
  color: var(--color-risk-low);
}

/* ── Timeline Arc (Compact & Visuel) ─────────────────────── */
.timeline-arc {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.arc-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  max-width: 320px;
  margin: 0 auto;
}

.arc-start, .arc-end {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.arc-label {
  font-family: 'Platform', sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.arc-year {
  font-family: 'Platform', sans-serif;
  font-size: 1.4rem;
  font-weight: 800;
}

.arc-year--prohibited { color: var(--color-risk-high); }
.arc-year--legal { color: var(--color-text-accent); text-shadow: 0 0 15px var(--color-text-accent-shadow); }
.arc-year--ongoing { color: var(--color-text-secondary); font-size: 0.9rem; margin-top: 6px; }

.arc-arrow {
  font-size: 1.2rem;
  color: var(--color-text-muted);
  opacity: 0.5;
  margin-top: 18px;
}

.arc-arrow--ongoing {
  opacity: 0.3;
  animation: pulseOpacity 2s infinite ease-in-out;
}

@keyframes pulseOpacity {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.5; }
}

.arc-laws {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--color-border-soft);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tl-law {
  font-family: 'Platform', sans-serif;
  font-size: 0.78rem;
  color: var(--color-text-dim);
  line-height: 1.4;
}

.tl-label {
  font-family: 'Platform', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.tl-law {
  font-family: 'Platform', sans-serif;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-style: italic;
}

/* ── Pénalités ───────────────────────────────────────────── */
.penalties-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.penalty-item {
  display: grid;
  grid-template-columns: 1.4rem 1fr;
  grid-template-rows: auto auto;
  gap: 0 10px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  padding: 12px 14px;
}

.penalty-icon {
  grid-row: 1 / 3;
  align-self: center;
  font-size: 1.1rem;
}

.penalty-type {
  font-family: 'Platform', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.penalty-desc {
  font-family: 'Platform', sans-serif;
  font-size: 0.84rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.penalty-item--heavy {
  border-color: var(--color-penalty-heavy-border);
  background: var(--color-penalty-heavy-bg);
}
.penalty-item--heavy .penalty-type {
  color: var(--color-risk-high);
}

/* ── Highlights ──────────────────────────────────────────── */
.highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.highlight-card {
  background: linear-gradient(135deg, var(--color-legal-glow-subtle) 0%, var(--color-bg-main) 100%);
  border: 1px solid var(--color-border-dim);
  border-radius: 14px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;
}

.hl-value {
  font-family: 'Platform', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-accent);
}

.hl-label {
  font-family: 'Platform', sans-serif;
  font-size: 0.72rem;
  color: var(--color-text-dim);
  line-height: 1.4;
}

/* ── CBD ─────────────────────────────────────────────────── */
.cbd-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-dim);
  border-radius: 14px;
  padding: 16px;
}

.cbd-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.cbd-leaf { font-size: 1.2rem; }

.cbd-title {
  font-family: 'Platform', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-risk-low);
  margin: 0;
}

.cbd-body { display: flex; flex-direction: column; gap: 8px; }

.cbd-year, .cbd-limit {
  font-family: 'Platform', sans-serif;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
}
.cbd-year strong, .cbd-limit strong { color: var(--color-cbd-accent); }

.cbd-desc {
  font-family: 'Platform', sans-serif;
  font-size: 0.84rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* ── Wikipedia ───────────────────────────────────────────── */
.wiki-section { border-top: 1px solid var(--color-border-ultra-soft); padding-top: 20px; }

.wiki-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.wiki-icon { font-size: 1rem; }

.wiki-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-muted);
  font-family: 'Platform', sans-serif;
  font-size: 0.82rem;
}

.wiki-spinner {
  width: 16px; height: 16px;
  border: 2px solid var(--color-border-dim);
  border-top-color: var(--color-legal);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.wiki-extract p {
  font-family: 'Platform', sans-serif;
  font-size: 0.83rem;
  color: var(--color-text-dim);
  line-height: 1.7;
  margin: 0 0 12px;
  font-style: italic;
}

.wiki-link {
  display: inline-block;
  font-family: 'Platform', sans-serif;
  font-size: 0.8rem;
  color: var(--color-legal);
  text-decoration: none;
  border-bottom: 1px solid var(--color-border-dim);
  padding-bottom: 1px;
  transition: color 0.2s, border-color 0.2s;
}
.wiki-link:hover { color: var(--color-text-accent); border-color: var(--color-text-accent); }
.wiki-link--contribute { color: var(--color-text-dim); border-color: var(--color-border-dim); }

.wiki-unavailable { display: flex; }

/* ── Transitions ─────────────────────────────────────────── */
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.3s; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

.modal-slide-enter-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
}
.modal-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 1, 1), opacity 0.25s;
}
.modal-slide-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.modal-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (min-width: 768px) {
  .modal-slide-enter-from {
    transform: translate(-50%, calc(-50% + 30px));
    opacity: 0;
  }
  .modal-slide-leave-to {
    transform: translate(-50%, calc(-50% + 20px));
    opacity: 0;
  }
  .modal-slide-enter-active,
  .modal-slide-leave-active {
    transform-origin: center center;
  }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
/* ── CTA NORML ─────────────────────────────────────────── */
.norml-cta {
  margin-top: 10px;
}
.cta-card {
  display: flex;
  gap: 16px;
  background: linear-gradient(135deg, var(--color-border-dim) 0%, var(--color-bg-main) 100%);
  border: 1px solid var(--color-border-dim);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px var(--color-shadow-main);
}
.cta-icon {
  font-size: 2rem;
  flex-shrink: 0;
}
.cta-title {
  font-family: 'Platform', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 6px;
}
.cta-text {
  font-family: 'Platform', sans-serif;
  font-size: 0.84rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0 0 16px;
}
.cta-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'Platform', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}
.btn--primary {
  background: var(--color-cta-accent);
  color: var(--color-text-white);
}
.btn--primary:hover {
  background: var(--color-cta-hover);
  transform: translateY(-1px);
}
.btn--secondary {
  background: var(--color-ui-close-bg);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-soft);
}
.btn--secondary:hover {
  background: var(--color-ui-close-hover);
}

.timeline-arc .arc-year--legal {
  text-shadow: 0 0 15px var(--color-text-accent-shadow);
}

/* ── Nouveaux Badges THC / CBD (Styles par état) ── */
.status--decriminalized { 
  background: rgba(224, 163, 0, 0.1); 
  color: var(--color-risk-medium); 
  border: 1px solid var(--color-risk-medium); 
  font-size: 0.72rem; 
}

/* On surcharge les badges secondaires pour qu'ils soient plus compacts que le badge principal */
.status-badge:not(:first-child) {
  font-size: 0.72rem;
  padding: 4px 10px;
}

/* ── Histoire (NORML Expert) ── */
.history-section { margin-top: 10px; }
.history-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  background: var(--color-bg-card);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid var(--color-border-ultra-soft);
}
.history-item--full { grid-column: 1 / -1; border-top: 1px dashed var(--color-border-soft); padding-top: 12px; margin-top: 4px; }

.history-label {
  font-family: 'Platform', sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: block;
  margin-bottom: 4px;
}
.history-text {
  font-family: 'Platform', sans-serif;
  font-size: 0.88rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin: 0;
}

/* ── Analyse NORML Expert ── */
.expert-section {
  background: var(--color-bg-main);
  border: 1px solid var(--color-border-dim);
  border-radius: 20px;
  padding: 20px;
  margin-top: 24px;
  box-shadow: inset 0 0 40px rgba(0,0,0,0.2);
}

.expert-verdict {
  display: flex;
  gap: 12px;
  background: var(--color-legal-glow-subtle);
  border: 1px solid var(--color-legal);
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 16px;
}
.verdict-icon { font-size: 1.4rem; }
.verdict-text {
  font-family: 'Platform', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.4;
}

.expert-risks-box {
  background: var(--color-penalty-heavy-bg);
  border-left: 4px solid var(--color-risk-high);
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  margin-bottom: 20px;
}
.risks-label {
  font-family: 'Platform', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-risk-high);
  text-transform: uppercase;
  display: block;
  margin-bottom: 6px;
}
.risks-content {
  font-family: 'Platform', sans-serif;
  font-size: 0.88rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}
.analysis-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--color-neutral-white-ultra-soft);
  border-radius: 10px;
}
.analysis-label {
  font-family: 'Platform', sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
}
.analysis-text {
  font-family: 'Platform', sans-serif;
  font-size: 0.82rem;
  color: var(--color-text-dim);
  line-height: 1.4;
  margin: 0;
}
</style>
