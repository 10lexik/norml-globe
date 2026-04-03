export interface CountryData {
  code: string
  name?: string
  flag?: string
  alias?: string
  status: 'legal' | 'tolerated' | 'prohibited' | 'nodata'
  thc_status?: 'legal' | 'tolerated' | 'decriminalized' | 'prohibited'
  cbd_status?: 'legal' | 'tolerated' | 'prohibited'
  history?: {
    prohibition?: string
    evolution?: string
    context?: string
  }
  norml_expert?: {
    summary?: string
    risks?: string
    analysis?: {
      social?: string
      racial?: string
      economic?: string
    }
  }
  wikipediaSlug?: string
  // Legacy fields for backward compatibility during migration
  legalizationYear?: string
  prohibitionYear?: string
  medical?: string
  stats?: string[]
}

// Design-related constants that are not content/UX text can stay here 
// if they are not in JSON. But user wanted colors in JSON too.
// We'll fetch colors from useI18n() in components.

