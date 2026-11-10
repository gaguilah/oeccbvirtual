// Formato de las respuestas de las preguntas frecuentes (docs/plan-preguntas-frecuentes.md). El
// texto se guarda tal cual lo escribe el personal y admite solo tres marcas, nunca HTML:
//   **negrita**
//   - elemento de lista (línea que empieza con "- ")
//   una línea en blanco separa párrafos (un salto de línea simple se respeta dentro del párrafo)
// FaqAnswer convierte los bloques en elementos de React, así que ningún texto llega como HTML.

export type AnswerBlock = { type: 'paragraph'; lines: string[] } | { type: 'list'; items: string[] }

export type InlinePart = { text: string; bold: boolean }

const LIST_ITEM = /^\s*[-•]\s+/

export function parseAnswer(text: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = []
  let current: AnswerBlock | null = null

  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line) {
      current = null
      continue
    }
    if (LIST_ITEM.test(raw)) {
      const item = raw.replace(LIST_ITEM, '').trim()
      if (!item) continue
      if (current?.type !== 'list') {
        current = { type: 'list', items: [] }
        blocks.push(current)
      }
      current.items.push(item)
      continue
    }
    if (current?.type !== 'paragraph') {
      current = { type: 'paragraph', lines: [] }
      blocks.push(current)
    }
    current.lines.push(line)
  }

  return blocks
}

// Partes de una línea con o sin negrita. Un "**" sin cerrar se deja como texto.
export function inlineParts(text: string): InlinePart[] {
  return text
    .split(/\*\*(.+?)\*\*/g)
    .map((part, index) => ({ text: part, bold: index % 2 === 1 }))
    .filter((part) => part.text !== '')
}

// Texto sin marcas en una sola línea, para el resumen de cada pregunta en el dashboard.
export function plainAnswer(text: string): string {
  return parseAnswer(text)
    .flatMap((block) => (block.type === 'list' ? block.items : block.lines))
    .join(' ')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}
