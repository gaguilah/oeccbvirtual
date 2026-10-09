import { useCallback, useState } from 'react'

// Menú lateral comprimido (solo íconos) desde lg. La elección se recuerda en este navegador.
const STORAGE_KEY = 'dashboard-sidebar-collapsed'

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(read)
  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // Sin almacenamiento (modo privado): la elección dura hasta recargar.
      }
      return next
    })
  }, [])
  return { collapsed, toggle }
}
