import { createContext, useContext } from 'react'
import { courtByNumber, type CourtNumber } from '../../lib/courts'
import type { Access } from './api'

export const SUPERADMIN = 'superadmin'

export type AccessContextType = {
  access: Access | null
  loading: boolean
  failed: boolean
  // Puede ver el dashboard: tiene perfil activo con rol.
  allowed: boolean
  mustChangePassword: boolean
  // ¿Puede hacer `permission` (sobre el juzgado `court`)? Misma lógica que public.has_permission:
  // solo para mostrar u ocultar; la protección real son las políticas RLS.
  can: (permission?: string, court?: CourtNumber) => boolean
  reload: () => Promise<void>
}

export const AccessContext = createContext<AccessContextType>({
  access: null,
  loading: true,
  failed: false,
  allowed: false,
  mustChangePassword: false,
  can: () => false,
  reload: async () => {},
})

export function useAccess() {
  return useContext(AccessContext)
}

export function checkPermission(access: Access | null, permission?: string, court?: CourtNumber): boolean {
  if (!access?.active || !access.role) return false
  if (!permission || access.role === SUPERADMIN) return true
  if (!access.permissions.includes(permission)) return false
  if (court !== undefined && access.scope === 'court') return access.court === court
  return true
}

// "Superadmin", "Oficina", "Juzgado · Juzgado 1".
export function roleLabel(access: Access | null): string | null {
  if (!access?.role_name) return null
  return access.court ? `${access.role_name} · ${courtByNumber(access.court).short}` : access.role_name
}
