import { useEffect, useState, type ReactNode } from 'react'
import { THEME_STORAGE_KEY, ThemeContext, readStoredTheme, type Theme } from './theme'

// "light" / "dark" se guardan como `data-theme` en <html>; "system" quita el atributo
// y deja que mande `prefers-color-scheme` (ver el variant `dark` en index.css).
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme

    try {
      if (theme === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
      else localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Almacenamiento no disponible (modo privado, etc.): el tema solo dura esta sesión.
    }
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
