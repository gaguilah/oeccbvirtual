import { useCallback, useEffect, useState } from 'react'
import { fetchRolesMatrix, type RolesMatrix } from './api'

type State = { matrix: RolesMatrix | null; loading: boolean; failed: boolean }

// Se carga una vez por visita a la Ayuda y se comparte entre pestañas.
export function useRolesMatrix() {
  const [state, setState] = useState<State>({ matrix: null, loading: true, failed: false })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    fetchRolesMatrix()
      .then((matrix) => active && setState({ matrix, loading: false, failed: false }))
      .catch((error) => {
        console.error('Error cargando los roles de la Ayuda:', error)
        if (active) setState({ matrix: null, loading: false, failed: true })
      })
    return () => {
      active = false
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ matrix: null, loading: true, failed: false })
    setAttempt((value) => value + 1)
  }, [])

  return { ...state, retry }
}
