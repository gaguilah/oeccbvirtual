import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

// Debe coincidir con la clave que lee el script en línea de index.html.
export const THEME_STORAGE_KEY = 'theme'

export type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextType>({ theme: 'system', setTheme: () => {} })

export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function useTheme() {
  return useContext(ThemeContext)
}
