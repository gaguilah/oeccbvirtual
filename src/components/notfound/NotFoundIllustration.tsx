import { cn } from '../../lib/cn'
import {
  IllustrationCanvas,
  IllustrationCard,
  IllustrationHatch,
  IllustrationMenu,
  IllustrationPanel,
  enter,
  illustrationIcons as icons,
  lift,
} from '../illustration'
import { siteRoutes, texts } from './illustrationData'

function Icon({ d, className }: { d: string[]; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      {d.map((path) => (
        <path key={path} strokeLinecap="round" strokeLinejoin="round" d={path} />
      ))}
    </svg>
  )
}

// Ilustración decorativa de la página 404 (ver docs/plan-404.md): "la ruta rota". En la barra del
// navegador se escribe sola la dirección que se intentó abrir y aparece un gran 404; a la izquierda,
// las rutas reales en línea y la intentada marcada como "No existe", con la conexión cortada.
// Con "reducir movimiento" se ve directamente el estado final.
export default function NotFoundIllustration({ path, className }: { path: string; className?: string }) {
  return (
    <IllustrationCanvas fade="left" compact className={className}>
      {/* Rutas del sitio (sale por el borde izquierdo y se desvanece). */}
      <IllustrationPanel label={texts.routesPanel} className={cn('top-6 -left-10 h-88 w-52', enter)}>
        <IllustrationCard title={texts.routesCard} icon={icons.squares} className={cn('top-10 left-4 w-44', lift)}>
          {/* Estado a la derecha de cada ruta: el lado izquierdo del panel se desvanece. */}
          {siteRoutes.map((route) => (
            <div key={route} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-mono text-on-surface-variant">{route}</span>
              <span className="size-2 shrink-0 rounded-full bg-green-500" />
            </div>
          ))}
          <div className={cn('space-y-0.5', enter, '[--illustration-delay:2200ms]')}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-mono text-on-surface line-through decoration-red-500/70">{path}</span>
              <Icon d={icons.xMark} className="size-3 shrink-0 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-right text-xs font-medium text-red-700 dark:text-red-400">{texts.missing}</p>
          </div>
        </IllustrationCard>
      </IllustrationPanel>

      {/* Conexión cortada: dos tramos punteados y una ✕ en el hueco. */}
      <div className={cn('absolute top-26 left-42 w-2.5 border-t border-dashed border-on-surface/30', enter)} />
      <Icon
        d={icons.xMark}
        className={cn(
          'absolute top-24.5 left-[calc(var(--u)*178)] size-3 text-red-500',
          enter,
          '[--illustration-delay:2200ms]',
        )}
      />
      <div className={cn('absolute top-26 left-46 w-2 border-t border-dashed border-on-surface/30', enter)} />

      <IllustrationPanel label={texts.browserPanel} className={cn('top-2 left-44 h-96 w-84', enter)}>
        <IllustrationHatch className={cn('top-12 left-6 h-44 w-76', enter, '[--illustration-delay:150ms]')} />
        <IllustrationCard
          title={texts.browserCard}
          icon={icons.globe}
          className={cn('top-10 left-4 h-44 w-76', enter, '[--illustration-delay:150ms]', lift)}
        >
          {/* Barra de direcciones: la ruta intentada se escribe sola. */}
          <div className="flex min-w-0 items-center gap-1.5 rounded-md bg-surface-variant px-2.5 py-1.5 text-sm">
            <Icon d={icons.lock} className="size-3.5 shrink-0 text-on-surface-variant/70" />
            <span className="inline-block max-w-full overflow-hidden font-mono whitespace-nowrap text-on-surface motion-safe:animate-illustration-type motion-safe:[--illustration-delay:400ms]">
              {path}
            </span>
            <span className="h-[1.2em] w-0.5 shrink-0 bg-primary motion-safe:animate-illustration-caret" />
          </div>

          {/* Resultado: 404 y "Sin resultados". */}
          <div className={cn('flex items-center gap-4 pt-2', enter, '[--illustration-delay:1900ms]')}>
            <span className="font-display text-[calc(var(--u)*52)] leading-none font-extrabold tracking-tight text-primary">
              404
            </span>
            <span className="flex items-center gap-1.5 text-sm text-on-surface-variant">
              <Icon d={icons.search} className="size-4 shrink-0" />
              {texts.notFound}
            </span>
          </div>
        </IllustrationCard>
      </IllustrationPanel>

      <IllustrationMenu
        items={[
          { label: texts.goHome, icon: icons.home },
          { label: texts.services, icon: icons.squares },
        ]}
        className={cn('top-55 left-62 w-48', enter, '[--illustration-delay:2400ms]', lift)}
      />
    </IllustrationCanvas>
  )
}
