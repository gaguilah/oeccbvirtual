import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { groupFaq } from './data'
import type { FaqGroup, FaqQuestion, FaqSection } from './types'

type UseFaqResult = {
  groups: FaqGroup[] | null
  error: string | null
}

// Secciones y preguntas publicadas (RLS: el público solo ve las publicadas, y solo estas columnas).
export function useFaq(): UseFaqResult {
  const [groups, setGroups] = useState<FaqGroup[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [sections, questions] = await Promise.all([
        supabase.from('faq_sections').select('id, slug, title, position').order('position'),
        supabase.from('faq_questions').select('id, section_id, question, answer, position').order('position'),
      ])
      if (cancelled) return
      if (sections.error || questions.error) {
        setError('No fue posible cargar las preguntas frecuentes. Intente de nuevo más tarde.')
        return
      }
      setGroups(groupFaq(sections.data as FaqSection[], questions.data as FaqQuestion[]))
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { groups, error }
}
