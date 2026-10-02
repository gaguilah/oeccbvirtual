import { cn } from '../../lib/cn'

type MenuItem = {
  label: string
  // Trazos del ícono (Heroicons outline, viewBox 24×24).
  icon: string[]
}

type IllustrationMenuProps = {
  items: MenuItem[]
  className?: string
}

// Menú oscuro flotante. La primera opción aparece resaltada; al pasar el mouse por el menú,
// el resaltado pasa a la opción bajo el cursor. Es decorativo: no hay botones reales.
export default function IllustrationMenu({ items, className }: IllustrationMenuProps) {
  return (
    <div
      className={cn(
        'group/menu absolute rounded-xl bg-inverse-surface p-1.5 text-on-inverse-surface shadow-2xl ring-1 ring-black/20',
        className,
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/15',
            index === 0 && 'bg-white/15 group-hover/menu:bg-transparent group-hover/menu:hover:bg-white/15',
          )}
        >
          <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            {item.icon.map((d) => (
              <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
            ))}
          </svg>
          {item.label}
        </div>
      ))}
    </div>
  )
}
