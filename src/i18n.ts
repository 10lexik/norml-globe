import { createI18n } from 'vue-i18n'
import ui from './locales/fr/ui.json'

// Import all country files from the regional batches
const countryModules = import.meta.glob('./locales/fr/countries/*.json', { eager: true })
const countries = Object.values(countryModules).reduce((acc: any, mod: any) => {
  return { ...acc, ...mod.default }
}, {})

const fr = {
  ...ui,
  countries
}

// Type-define 'en-US' as the master schema for the resource
type MessageSchema = typeof fr

export const i18n = createI18n<[MessageSchema], 'fr'>({
  legacy: false, // you must set `false`, to use Composition API
  locale: 'fr', // set locale
  fallbackLocale: 'fr', // set fallback locale
  messages: {
    fr
  }
})

