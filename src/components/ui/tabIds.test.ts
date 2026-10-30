import { describe, expect, it } from 'vitest'
import { tabIds, tabPanelProps } from './tabIds'

describe('ids de pestañas', () => {
  it('la pestaña y su panel se enlazan con el mismo prefijo e id', () => {
    const ids = tabIds(':r1:', 'cuenta')
    expect(ids).toEqual({ tab: ':r1:-tab-cuenta', panel: ':r1:-panel-cuenta' })

    const panel = tabPanelProps(':r1:', 'cuenta')
    expect(panel).toMatchObject({ id: ids.panel, role: 'tabpanel', 'aria-labelledby': ids.tab, tabIndex: 0 })
  })

  it('prefijos distintos no chocan', () => {
    expect(tabIds('a', 'x').panel).not.toBe(tabIds('b', 'x').panel)
  })
})
