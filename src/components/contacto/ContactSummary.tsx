import type { ReactNode } from 'react'
import {
  CONTACT_ADDRESS,
  CONTACT_CITY,
  CONTACT_DAYS,
  CONTACT_DEPARTMENT,
  CONTACT_EMAIL,
  CONTACT_HOURS,
  CONTACT_HOURS_NOTE,
  CONTACT_MAPS_URL,
} from '../../lib/contact'
import { cn } from '../../lib/cn'
import { illustrationIcons as icons } from '../illustration'
import { Badge } from '../ui'
import CopyButton from './CopyButton'

type ItemProps = {
  icon: string[]
  label: string
  // Ancho base en la fila de tableta y celular (el correo necesita más).
  wide?: boolean
  children: ReactNode
}

// Tableta y celular: los datos van en fila y saltan de línea según el espacio (flex-wrap);
// cada uno crece desde su ancho base. Íconos más pequeños en celular. Escritorio (lg): columna.
function Item({ icon, label, wide = false, children }: ItemProps) {
  return (
    <li className={cn('flex min-w-0 gap-3 lg:flex-none lg:gap-4', wide ? 'flex-[1_1_19rem]' : 'flex-[1_1_14rem]')}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-container text-primary sm:size-9 sm:rounded-lg lg:size-10">
        <svg
          className="size-4 sm:size-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          {icon.map((d) => (
            <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
          ))}
        </svg>
      </span>
      <div className="min-w-0 space-y-1.5 text-sm text-on-surface-variant">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{label}</p>
        {children}
      </div>
    </li>
  )
}

const linkClass = 'inline-flex items-center gap-1 font-medium whitespace-nowrap text-primary hover:underline'

// El correo solo se parte después de la @ (nunca a mitad de palabra).
const [emailUser, emailDomain] = CONTACT_EMAIL.split('@')

// Datos de contacto reales junto al título (la ilustración es decorativa y los lectores de
// pantalla la omiten). Cada dato aparece una sola vez en la página.
export default function ContactSummary({ className }: { className?: string }) {
  return (
    <address className={cn('not-italic', className)}>
      <ul className="flex flex-wrap gap-6 lg:flex-col">
        <Item icon={icons.mapPin} label="Dirección">
          <p>
            <span className="block font-medium text-on-surface">{CONTACT_ADDRESS}</span>
            {CONTACT_CITY}, {CONTACT_DEPARTMENT}
          </p>
          <a href={CONTACT_MAPS_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Ver en Google Maps
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>
        </Item>
        <Item icon={icons.mail} label="Correo electrónico" wide>
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium break-words text-primary hover:underline">
            {emailUser}@<wbr />
            {emailDomain}
          </a>
          <CopyButton value={CONTACT_EMAIL} label="Copiar correo" />
        </Item>
        <Item icon={icons.clock} label="Horario de atención">
          <p>
            <span className="block font-medium text-on-surface">{CONTACT_DAYS}</span>
            {CONTACT_HOURS}
          </p>
          <Badge variant="success">{CONTACT_HOURS_NOTE}</Badge>
        </Item>
      </ul>
    </address>
  )
}
