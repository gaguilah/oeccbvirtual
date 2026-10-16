import { Alert, Badge, Button, Spinner } from '../../components/ui'
import { bodyCell, bodyRow, headerCell } from '../../components/remates/tableStyles'
import type { RolesMatrix } from './api'

// Módulos con datos por juzgado: solo en ellos importa el alcance del rol.
const COURT_MODULES = ['audiencias', 'remates']

const SCOPE_LABEL = { all: 'Los dos juzgados', court: 'Solo su juzgado' }

type RolesTableProps = {
  modules: string[]
  matrix: RolesMatrix | null
  loading: boolean
  failed: boolean
  onRetry: () => void
}

// "Quién puede hacer qué" con los permisos configurados hoy en Roles: una fila por rol con los
// nombres de sus permisos de estos módulos (los que se editan en Permisos). El rol del sistema
// (superadmin) va al final como "Administrador de Sistema".
export default function RolesTable({ modules, matrix, loading, failed, onRetry }: RolesTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-6 text-primary">
        <Spinner />
      </div>
    )
  }
  if (failed || !matrix) {
    return (
      <Alert variant="warning" live={false} title="No se pudo cargar la tabla de permisos">
        <p>El resto de la guía se puede leer normalmente.</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          Intentar de nuevo
        </Button>
      </Alert>
    )
  }

  const names = new Map(matrix.permissions.map((permission) => [permission.code, permission.name]))
  const inModules = (code: string) => modules.includes(code.split('.')[0])
  const order = matrix.permissions.filter((permission) => inModules(permission.code)).map((p) => p.code)
  const showScope = modules.some((module) => COURT_MODULES.includes(module))
  const roles = matrix.roles.filter((role) => !role.isSystem)

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg bg-surface-container-lowest">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Permisos de cada rol en esta sección</caption>
          <thead className="bg-surface-container-low">
            <tr>
              <th scope="col" className={headerCell}>
                Rol
              </th>
              {showScope && (
                <th scope="col" className={headerCell}>
                  Alcance
                </th>
              )}
              <th scope="col" className={headerCell}>
                Puede
              </th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => {
              const codes = order.filter((code) => role.permissions.includes(code))
              const viewOnly = codes.length > 0 && codes.every((code) => code.endsWith('.ver'))
              return (
                <tr key={role.name} className={bodyRow}>
                  <th scope="row" className={`${bodyCell} font-semibold text-on-surface`}>
                    {role.name}
                  </th>
                  {showScope && <td className={`${bodyCell} text-on-surface-variant`}>{SCOPE_LABEL[role.scope]}</td>}
                  <td className={bodyCell}>
                    {codes.length === 0 ? (
                      <span className="text-on-surface-variant">Sin acceso</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{codes.map((code) => names.get(code) ?? code).join(' · ')}</span>
                        {viewOnly && <Badge>Solo consulta</Badge>}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            <tr className={bodyRow}>
              <th scope="row" className={`${bodyCell} font-semibold text-on-surface`}>
                Administrador de Sistema
              </th>
              {showScope && <td className={`${bodyCell} text-on-surface-variant`}>{SCOPE_LABEL.all}</td>}
              <td className={bodyCell}>Todo</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-on-surface-variant">
        Los permisos de cada rol no son fijos: se ajustan según lo que defina el Director de oficina o lo que se acuerde
        con los funcionarios. Esta tabla muestra los de hoy. Si una opción no le aparece, su rol no la incluye en este
        momento.
      </p>
    </div>
  )
}
