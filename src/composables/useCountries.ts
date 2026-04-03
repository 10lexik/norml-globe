import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CountryData } from '../data/countries'

export function useCountries() {
  const { t, tm, te } = useI18n()

  const allCountries = computed(() => tm('countries') as Record<string, CountryData>)
  
  const palette = computed(() => (tm('ui') as any)?.palette || {})
  
  const resolvePalette = (colors: Record<string, string>) => {
    const resolved: Record<string, string> = {}
    Object.entries(colors).forEach(([key, val]) => {
      if (typeof val === 'string' && val.startsWith('palette.')) {
        const pKey = val.split('.')[1]
        resolved[key] = palette.value[pKey] || val
      } else {
        resolved[key] = val
      }
    })
    return resolved
  }

  const statusColors = computed(() => {
    const raw = (tm('ui') as any)?.status_colors || {}
    return resolvePalette(raw)
  })

  const themeColors = computed(() => {
    const raw = (tm('ui') as any)?.theme_colors || {}
    return resolvePalette(raw)
  })

  const stats = computed(() => {
    const all = Object.values(allCountries.value)
    return {
      legal: all.filter(c => c.status === 'legal').length,
      tolerated: all.filter(c => c.status === 'tolerated').length,
      prohibited: all.filter(c => c.status === 'prohibited').length,
    }
  })

  const getCountry = (code: string | null): CountryData | null => {
    if (!code) return null
    const data = allCountries.value[code]
    return data ? { ...data, code } : null
  }

  const tCountry = (code: string | undefined, field: string) => {
    if (!code) return ''
    const key = `countries.${code}.${field}`
    return te(key) ? t(key) : ''
  }

  const tCountryArr = (code: string | undefined, field: string): string[] => {
    if (!code) return []
    const key = `countries.${code}.${field}`
    return te(key) ? (tm(key) as string[]) : []
  }

  const wikiConfig = computed(() => tm('ui.config.wiki') as {
    baseUrl: string,
    restApiUrl: string,
    searchTerm: string,
    filterKeywords: string[],
    fallbackTitle: string
  })

  return {
    allCountries,
    statusColors,
    themeColors,
    stats,
    wikiConfig,
    getCountry,
    tCountry,
    tCountryArr
  }
}
