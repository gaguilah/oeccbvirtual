import type { Hearing } from '../types'
import { hearingFormatData, hearingFormatFileName } from './data'

// Genera el formato en el navegador y lo descarga. No se guarda en ningún lado: los datos de quién
// registró la grabación quedan fijos en la audiencia, así que siempre sale igual.
export async function downloadHearingFormat(hearing: Hearing, typeName: string): Promise<void> {
  let blob: Blob
  try {
    const { renderHearingFormat } = await import('./render')
    blob = await renderHearingFormat(hearingFormatData(hearing, typeName))
  } catch (error) {
    console.error('Error generando el formato:', error)
    throw new Error('No se pudo generar el formato. Intente de nuevo.', { cause: error })
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = hearingFormatFileName(hearing)
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
