import { Outlet } from 'react-router-dom'
import { Footer, Header } from '../components/layout'

export default function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
