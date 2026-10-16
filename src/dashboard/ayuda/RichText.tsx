// Texto de la Ayuda con **negrita** (lo único que admite el contenido; nada de HTML).
export default function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-semibold text-on-surface">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  )
}
