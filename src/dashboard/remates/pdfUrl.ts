import { bogotaParts } from './datetime'
import type { PdfFolder } from './types'

// Misma fórmula que el trigger auction_notices_before_write (migración 20261002120000): si una
// cambia, cambiar la otra. Solo para la vista previa: la URL que vale es la que guarda la base.
//   https://publicacionesprocesales.ramajudicial.gov.co/documents/<group>/<folder>/
//     <radicado>-<AAAAMMDD><HH 12 h>-J0<juzgado>ECC.pdf
export function previewPdfUrl(folder: PdfFolder, caseNumber: string, court: number, scheduledAt: string): string {
  const { date, hour } = bogotaParts(scheduledAt)
  const hour12 = String(hour % 12 || 12).padStart(2, '0')
  return (
    `https://publicacionesprocesales.ramajudicial.gov.co/documents/${folder.group_id}/${folder.folder_id}/` +
    `${caseNumber}-${date.replaceAll('-', '')}${hour12}-J0${court}ECC.pdf`
  )
}

// Carpeta vigente en una fecha (la más reciente con valid_from <= fecha). Las carpetas llegan
// ordenadas de la más nueva a la más vieja.
export function folderFor(folders: PdfFolder[], date: string): PdfFolder | null {
  return folders.find((folder) => folder.valid_from <= date) ?? null
}
