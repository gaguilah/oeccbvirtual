import { Alert } from '../../components/ui'
import { bodyCell, bodyRow, headerCell } from '../../components/remates/tableStyles'
import type { RolesMatrix } from './api'
import RichText from './RichText'
import RolesTable from './RolesTable'
import type { GuideBlock } from './types'

const infoIcon = (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
    />
  </svg>
)

export type RolesState = { matrix: RolesMatrix | null; loading: boolean; failed: boolean; retry: () => void }

type GuideBlocksProps = { blocks: GuideBlock[]; modules: string[]; roles: RolesState }

// Bloques de una sección de la Ayuda.
export default function GuideBlocks({ blocks, modules, roles }: GuideBlocksProps) {
  return (
    <div className="space-y-4 text-on-surface-variant">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <p key={index}>
                <RichText text={block.text} />
              </p>
            )
          case 'list':
          case 'steps': {
            const List = block.type === 'steps' ? 'ol' : 'ul'
            return (
              <List
                key={index}
                className={`space-y-2 pl-5 ${block.type === 'steps' ? 'list-decimal' : 'list-disc'} marker:text-primary`}
              >
                {block.items.map((item) => (
                  <li key={item}>
                    <RichText text={item} />
                  </li>
                ))}
              </List>
            )
          }
          case 'table':
            return (
              <div key={index} className="overflow-x-auto rounded-lg bg-surface-container-lowest">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-low">
                    <tr>
                      {block.headers.map((header) => (
                        <th key={header} scope="col" className={headerCell}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row) => (
                      <tr key={row.join('|')} className={bodyRow}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className={bodyCell}>
                            <RichText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'note':
            return (
              <Alert key={index} variant={block.tone ?? 'info'} live={false} title={block.title} icon={infoIcon}>
                <RichText text={block.text} />
              </Alert>
            )
          case 'roles':
            return (
              <RolesTable
                key={index}
                modules={modules}
                matrix={roles.matrix}
                loading={roles.loading}
                failed={roles.failed}
                onRetry={roles.retry}
              />
            )
        }
      })}
    </div>
  )
}
