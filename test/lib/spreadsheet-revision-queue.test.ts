import {expect} from 'chai'

import SpreadsheetRevisionQueue = require('../../src/lib/spreadsheet-revision-queue')
import random = require('../../src/lib/random')

const fakeSpreadsheetId = 'm62a4lk5g4'
const fakeSheetTitle = 'Lorem ipsum'
const fakeSpreadsheet = {
  spreadsheetId: fakeSpreadsheetId,
  properties: {
    title: 'xray'
  },
  sheets: [
    {
      properties: {
        sheetId: 0,
        title: 'Sheet1',
        index: 0
      },
      values: []
    }
  ]
}

const seed = 13
const firstRandomSheetId = 51208187

describe('SpreadsheetRevisionQueue', () => {
  beforeEach(() => {
    random.seed(seed)
  })

  it('it starts empty', () => {
    const queue = new SpreadsheetRevisionQueue(fakeSpreadsheet)
    const parameters = JSON.parse(JSON.stringify(queue))

    expect(parameters.spreadsheetId).to.equal(fakeSpreadsheetId)
    expect(parameters.requestBody).to.be.an('object')
    expect(parameters.requestBody.requests).to.be.empty
  })

  describe('add', () => {
    it('it adds a sheet', () => {
      const queue = new SpreadsheetRevisionQueue(fakeSpreadsheet)
      queue.add(fakeSheetTitle)

      const parameters = JSON.parse(JSON.stringify(queue))
      expect(parameters.requestBody.requests.length).to.equal(3)
    })

    it('it generates `sheetId` for new sheets', () => {
      const queue = new SpreadsheetRevisionQueue(fakeSpreadsheet)
      queue.add(fakeSheetTitle)

      const parameters = JSON.parse(JSON.stringify(queue))
      const properties = parameters.requestBody.requests[0].addSheet.properties
      expect(properties.sheetId).to.equal(firstRandomSheetId)
    })

    it('it freezes 1 row and 3 columns in new sheets', () => {
      const queue = new SpreadsheetRevisionQueue(fakeSpreadsheet)
      queue.add(fakeSheetTitle)

      const parameters = JSON.parse(JSON.stringify(queue))
      const {addSheet} = parameters.requestBody.requests[0]
      expect(addSheet.properties.gridProperties.frozenRowCount).to.equal(1)
      expect(addSheet.properties.gridProperties.frozenColumnCount).to.equal(3)
    })

    it('it formats the first row in new sheets', () => {
      const queue = new SpreadsheetRevisionQueue(fakeSpreadsheet)
      queue.add(fakeSheetTitle)

      const parameters = JSON.parse(JSON.stringify(queue))
      const {updateCells} = parameters.requestBody.requests[1]
      const n = 26

      expect(updateCells.fields).to.equal('userEnteredFormat')
      expect(updateCells.range.sheetId).to.equal(firstRandomSheetId)
      expect(updateCells.rows.length, 'Updates apply to more than one row').to.equal(1)
      expect(updateCells.rows[0].values.length).to.equal(n)

      const value = updateCells.rows[0].values[0]
      for (let i = 1; i < n; ++i) {
        expect(value, 'Format values are not uniform').to.deep.equal(updateCells.rows[0].values[i])
      }
    })

    it('it sizes columns to fit their content', () => {
      const queue = new SpreadsheetRevisionQueue(fakeSpreadsheet)
      queue.add(fakeSheetTitle)

      const parameters = JSON.parse(JSON.stringify(queue))
      const {autoResizeDimensions} = parameters.requestBody.requests[2]

      expect(autoResizeDimensions.dimensions.dimension).to.equal('COLUMNS')
      expect(autoResizeDimensions.dimensions.sheetId).to.equal(firstRandomSheetId)
    })
  })

  describe('set', () => {
    let updateCells: any

    before(() => {
      const queue = new SpreadsheetRevisionQueue(fakeSpreadsheet)

      const rows: any = [
        ['Student ID', 'Name', 'Email Address'],
        [2357, 'Gibson, William', 'wgibson67@dtechhs.org']
      ]

      const range = {
        endColumnIndex: 2,
        endRowIndex: 1,
        sheetId: firstRandomSheetId,
        startColumnIndex: 0,
        startRowIndex: 0
      }

      queue.set(range, SpreadsheetRevisionQueue.glossRowData(rows))

      updateCells = JSON.parse(JSON.stringify(queue)).requestBody.requests[0].updateCells
    })

    it('parses fields', () => {
      expect(updateCells.fields).to.equal('userEnteredValue')
    })

    it('glosses row/cell data', () => {
      const {rows: r} = updateCells
      const {values: r0} = r[0]
      const {values: r1} = r[1]
      expect(r0[0].userEnteredValue.stringValue, 'Expected stringValue').to.be
      expect(r0[1].userEnteredValue.stringValue, 'Expected stringValue').to.be
      expect(r0[2].userEnteredValue.stringValue, 'Expected stringValue').to.be
      expect(r1[0].userEnteredValue.numberValue, 'Expected numberValue').to.be
      expect(r1[1].userEnteredValue.stringValue, 'Expected stringValue').to.be
      expect(r1[2].userEnteredValue.stringValue, 'Expected stringValue').to.be
    })
  })

  describe('remove', () => {
    it('removes a sheet', () => {
      const queue = new SpreadsheetRevisionQueue(fakeSpreadsheet)
      queue.remove(firstRandomSheetId)

      const parameters = JSON.parse(JSON.stringify(queue))
      const {deleteSheet} = parameters.requestBody.requests[0]
      expect(deleteSheet.sheetId).to.equal(firstRandomSheetId)
    })
  })
})
