import { createElement, type ReactElement } from 'react'
import { Font, pdf, type DocumentProps } from '@react-pdf/renderer'
import robotoBold from '@fontsource/roboto/files/roboto-latin-700-normal.woff?url'
import robotoRegular from '@fontsource/roboto/files/roboto-latin-400-normal.woff?url'
import type { HearingFormatData } from './data'
import HearingFormatDocument from './HearingFormatDocument'

// Se carga solo al descargar el primer formato (import() en download.ts): aquí entra la librería de
// PDF, la fuente (incluida en el sitio, normal y negrita) y el logo.
Font.register({
  family: 'Roboto',
  fonts: [
    { src: robotoRegular, fontWeight: 400 },
    { src: robotoBold, fontWeight: 700 },
  ],
})
// Sin guiones de partición: en español la librería parte mal las palabras.
Font.registerHyphenationCallback((word) => [word])

export function renderHearingFormat(data: HearingFormatData): Promise<Blob> {
  const document = createElement(HearingFormatDocument, { data }) as ReactElement<DocumentProps>
  return pdf(document).toBlob()
}
