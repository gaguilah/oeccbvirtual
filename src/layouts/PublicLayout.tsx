import { Outlet } from 'react-router-dom'
import { Footer, Header } from '../components/layout'

type PublicLayoutProps = {
  // Muestra el footer (por defecto). Las páginas que no lo necesitan, como /login, usan
  // un grupo de rutas con footer={false} en App.tsx.
  footer?: boolean
}

export default function PublicLayout({ footer = true }: PublicLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      {footer && <Footer />}
    </div>
  )
}
