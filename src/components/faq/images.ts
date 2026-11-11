import { faqImageUrl } from './data'

// URL pública de una imagen de las preguntas frecuentes, con la URL de Supabase del entorno.
export function faqImageSrc(path: string): string {
  return faqImageUrl(import.meta.env.VITE_SUPABASE_URL, path)
}
