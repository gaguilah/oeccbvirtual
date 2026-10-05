// Cuerpo común de ServiceCard y ExternalLinkCard: ícono, título y descripción.
export default function CardBody({ icon, title, description }: { icon: string[]; title: string; description: string }) {
  return (
    <>
      <span className="flex size-12 items-center justify-center rounded-lg bg-primary-container text-primary">
        <svg
          className="size-6"
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
      <span className="flex-1 space-y-2">
        <span className="block font-display text-xl font-bold tracking-[-0.02em] text-on-surface">{title}</span>
        <span className="block text-sm text-on-surface-variant">{description}</span>
      </span>
    </>
  )
}
