import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { makeRowId, makeSheetId, type RowId, type SheetId } from '../../src/types/brand.js'

test('Brand types', async (t) => {
  await t.test('makeRowId creates branded RowId', () => {
    const id = 'test-row-id'
    const rowId = makeRowId(id)
    
    // Check that the value is the same
    assert.equal(rowId, id)
    
    // TypeScript will ensure this is type RowId at compile time
    const assignToRowId: RowId = rowId
    assert.equal(assignToRowId, id)
  })
  
  await t.test('makeSheetId creates branded SheetId', () => {
    const id = 'test-sheet-id'
    const sheetId = makeSheetId(id)
    
    // Check that the value is the same
    assert.equal(sheetId, id)
    
    // TypeScript will ensure this is type SheetId at compile time
    const assignToSheetId: SheetId = sheetId
    assert.equal(assignToSheetId, id)
  })
  
  await t.test('branded types maintain string behavior', () => {
    const rowId = makeRowId('row-123')
    const sheetId = makeSheetId('sheet-456')
    
    // Can use string methods
    assert.equal(rowId.length, 7)
    assert.equal(sheetId.toUpperCase(), 'SHEET-456')
    assert.ok(rowId.startsWith('row'))
    assert.ok(sheetId.endsWith('456'))
  })
  
  await t.test('branded types can be used in collections', () => {
    const rowIds = new Set<RowId>()
    const id1 = makeRowId('id-1')
    const id2 = makeRowId('id-2')
    
    rowIds.add(id1)
    rowIds.add(id2)
    
    assert.equal(rowIds.size, 2)
    assert.ok(rowIds.has(id1))
    assert.ok(rowIds.has(id2))
    
    // Map usage
    const sheetMap = new Map<SheetId, string>()
    const sheetId = makeSheetId('sheet-1')
    sheetMap.set(sheetId, 'Sheet One')
    
    assert.equal(sheetMap.get(sheetId), 'Sheet One')
  })
})