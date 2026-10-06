import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'
import type { PermissionGroup } from './data'

type PermissionMatrixProps = {
  groups: PermissionGroup[]
  selected: string[]
  onChange: (selected: string[]) => void
  readOnly?: boolean
  className?: string
}

// Casilla "todo el módulo": marcada, desmarcada o a medias (indeterminate, que solo existe por JS).
function ModuleCheckbox({
  checked,
  indeterminate,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { indeterminate: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} className="size-4 accent-primary" {...props} />
}

// Permisos del rol agrupados por módulo, con "Todo el módulo" para marcar o desmarcar el grupo.
export default function PermissionMatrix({ groups, selected, onChange, readOnly, className }: PermissionMatrixProps) {
  const isSelected = (code: string) => selected.includes(code)

  function toggle(code: string) {
    onChange(isSelected(code) ? selected.filter((item) => item !== code) : [...selected, code])
  }

  function toggleGroup(group: PermissionGroup) {
    const codes = group.permissions.map((permission) => permission.code)
    const all = codes.every(isSelected)
    onChange(all ? selected.filter((code) => !codes.includes(code)) : [...new Set([...selected, ...codes])])
  }

  return (
    <div className={cn('grid gap-4 lg:grid-cols-2', className)}>
      {groups.map((group) => {
        const count = group.permissions.filter((permission) => isSelected(permission.code)).length
        return (
          <fieldset key={group.module} className="rounded-lg bg-surface-container-low p-4 sm:p-5" disabled={readOnly}>
            <legend className="sr-only">{group.label}</legend>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-sans text-sm font-semibold text-on-surface" aria-hidden="true">
                {group.label}
              </h3>
              <label className="flex items-center gap-2 text-xs text-on-surface-variant">
                <ModuleCheckbox
                  checked={count === group.permissions.length}
                  indeterminate={count > 0 && count < group.permissions.length}
                  onChange={() => toggleGroup(group)}
                  aria-label={`Todo el módulo ${group.label}`}
                />
                Todo el módulo
              </label>
            </div>
            <ul className="space-y-1">
              {group.permissions.map((permission) => (
                <li key={permission.code}>
                  <label
                    className={cn(
                      'flex gap-3 rounded-md p-2 transition-colors',
                      !readOnly && 'cursor-pointer hover:bg-surface-container',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected(permission.code)}
                      onChange={() => toggle(permission.code)}
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-on-surface">{permission.name}</span>
                      {permission.description && (
                        <span className="block text-xs text-on-surface-variant">{permission.description}</span>
                      )}
                      <code className="mt-0.5 block font-mono text-[0.6875rem] text-on-surface-variant/80">
                        {permission.code}
                      </code>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )
      })}
    </div>
  )
}
