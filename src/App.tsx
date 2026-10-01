import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [status, setStatus] = useState('Probando conexión...')

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error de conexión:', error)
        setStatus('Error: revisa la consola')
        return
      }

      console.log('Conexión exitosa. Sesión actual:', data.session)
      setStatus('Conexión exitosa con Supabase (revisa la consola)')
    }

    testConnection()
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Prueba de conexión</h1>
      <p>{status}</p>
    </div>
  )
}

export default App