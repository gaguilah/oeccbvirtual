import { useEffect } from 'react'
import { SITE_NAME } from './contact'

type DocumentMeta = {
  // Nombre de la página: la pestaña muestra "OECCB Virtual | <title>". null no cambia nada
  // (p. ej. un tutorial inexistente, donde la página 404 pone su propio título).
  title: string | null
  // Agrega <meta name="robots" content="noindex"> (p. ej. en la página 404).
  noindex?: boolean
}

// Cambia el título de la pestaña (y opcionalmente marca la página como no indexable) mientras el
// componente está montado; al desmontarse restaura el título anterior y quita la etiqueta.
export function useDocumentMeta({ title, noindex = false }: DocumentMeta) {
  useEffect(() => {
    if (title === null) return

    const previousTitle = document.title
    document.title = `${SITE_NAME} | ${title}`

    let robots: HTMLMetaElement | null = null
    if (noindex) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      robots.content = 'noindex'
      document.head.appendChild(robots)
    }

    return () => {
      document.title = previousTitle
      robots?.remove()
    }
  }, [title, noindex])
}
