import type { SurveyDetail, SurveyQuestion } from './types'

// Preguntas y encuesta de prueba para results, csv y data.
export const yesNoQuestion: SurveyQuestion = {
  id: 'q1',
  code: 'atencion',
  position: 1,
  text: '¿Lo atendieron a tiempo?',
  help_text: null,
  type: 'yes_no',
  scale_min: null,
  scale_max: null,
  min_label: null,
  max_label: null,
  is_required: true,
}

export const scaleQuestion: SurveyQuestion = {
  id: 'q2',
  code: 'satisfaccion',
  position: 2,
  text: 'Califique; "en general" la atención',
  help_text: null,
  type: 'scale',
  scale_min: 1,
  scale_max: 5,
  min_label: 'Malo',
  max_label: 'Excelente',
  is_required: false,
}

export const testSurvey: SurveyDetail = {
  id: 's1',
  code: 'satisfaccion-oeccb',
  title: 'Satisfacción OECCB',
  is_active: true,
  created_at: '2026-01-15T08:00:00-05:00',
  questions: [yesNoQuestion, scaleQuestion],
}
