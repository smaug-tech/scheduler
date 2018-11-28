// FIXME: Use googleapis type information.
// import {sheets_v4} from 'googleapis'

import random = require('./random')

interface SheetIdTable {
  [key: number]: number
}

const headerTextFormatCellData: any = {
  userEnteredFormat: {
    textFormat: {
      bold: true
    }
  }
}

const headerTextFormatRowData: any = [
  {
    values: new Array(26).fill(headerTextFormatCellData)
  }
]

const gridProperties = {
  frozenColumnCount: 3,
  frozenRowCount: 1
}

const supportedFields = [
  'dataValidation',
  'hyperlink',
  'note',
  'userEnteredFormat',
  'userEnteredValue'
]

function parseFields(rows: any[]): string {
  const fields = {} as any

  rows.forEach(({values}) => {
    values.forEach((value: any) => {
      Object.keys(value).forEach((field: string) => {
        if (supportedFields.indexOf(field) > -1) {
          fields[field] = true
        } else {
          throw new Error(`Unsupported field: ${field}`)
        }
      })
    })
  })

  return Object.keys(fields).join(',')
}

class SpreadsheetRevisionQueue {
  public static get paceDataValidation(): any {
    return {
      dataValidation: {
        condition: {
          type: 'ONE_OF_LIST',
          values: [
            {userEnteredValue: 'Behind Pace (-1)'},
            {userEnteredValue: 'On Pace (0)'},
            {userEnteredValue: 'Ahead (+1)'}
          ]
        },
        showCustomUi: true,
        strict: true
      }
    }
  }

  public static get validPaceByName(): any {
    return {
      Ahead: 'Ahead (+1)',
      Behind: 'Behind Pace (-1)',
      On: 'On Pace (0)'
    }
  }

  public static glossExtendedValue(value: any): any {
    switch (typeof value) {
      case 'boolean':
        return {boolValue: value as boolean}
      case 'number':
        return {numberValue: value as number}
      case 'object':
        // XXX: Throw away garbage input.
        return {stringValue: ''}
    }

    return {stringValue: (value || '') as string}
  }

  public static glossCellData(value: any, gloss = SpreadsheetRevisionQueue.glossExtendedValue): any {
    return {
      userEnteredValue: gloss(value)
    }
  }

  public static glossRowData(rows: any[][], gloss = SpreadsheetRevisionQueue.glossCellData) {
    // tslint:disable-next-line:no-unnecessary-callback-wrapper
    return rows.map((row: any[]) => ({values: row.map((cell) => gloss(cell))}))
  }

  public static glossCellValidation(value: any, gloss = (x: any) => x): any {
    return {
      dataValidation: gloss(value)
    }
  }

  public static glossRowValidation(rows: any[][], gloss = SpreadsheetRevisionQueue.glossCellValidation) {
    // tslint:disable-next-line:no-unnecessary-callback-wrapper
    return rows.map((row: any[]) => ({values: row.map((cell) => gloss(cell))}))
  }

  constructor(spreadsheet: any) {
    this._spreadsheetId = spreadsheet.spreadsheetId
    this._sheetIds = spreadsheet.sheets.reduce((accumulator: SheetIdTable, sheet: any) => {
      accumulator[sheet.properties.sheetId] = 1
      return accumulator
    }, {})

    this._add = []
    this._remove = []
    this._set = []
    this._updatingSheetIds = {}
  }

  private _add: any[]

  private _remove: any[]

  private _set: any[]

  private _spreadsheetId: string

  private _updatingSheetIds: SheetIdTable

  private _sheetIds: SheetIdTable

  public get spreadsheetId() {
    return this._spreadsheetId
  }

  public get requests() {
    const requests: any[] = this._add.concat(this._remove).concat(this._set)

    Object.keys(this._updatingSheetIds).forEach((sheetId) => {
      requests.push({
        autoResizeDimensions: {
          dimensions: {
            dimension: 'COLUMNS',
            sheetId: Number(sheetId)
          }
        }
      })
    })

    return requests
  }

  public add(title: string, index?: number): number {
    const sheetId = this.makeRandomSheetId()

    this._add.push({
      addSheet: {
        properties: {
          gridProperties,
          index,
          sheetId,
          title
        }
      }
    })

    const range = {
      endColumnIndex: headerTextFormatRowData.reduce((n: number, r: any[]) => Math.max(n, r.values.length), 0),
      endRowIndex: headerTextFormatRowData.length,
      sheetId,
      startColumnIndex: 0,
      startRowIndex: 0
    }

    this.set(range, headerTextFormatRowData)

    this._updatingSheetIds[sheetId] = 1
    this._sheetIds[sheetId] = 1

    return sheetId
  }

  public remove(sheetId: number): number {
    this._remove.push({
      deleteSheet: {
        sheetId
      }
    })

    delete this._updatingSheetIds[sheetId]

    return sheetId
  }

  public rename(sheetId: number, title: string) {
    this._set.push({
      updateSheetProperties: {
        fields: 'sheetId,title',
        properties: {
          sheetId,
          title
        }
      }
    })
  }

  public set(range: any, rows: any[]): number {
    this._set.push({
      updateCells: {
        fields: parseFields(rows),
        range,
        rows
      }
    })

    this._updatingSheetIds[range.sheetId] = 1
    this._sheetIds[range.sheetId] = 1

    return range.sheetId
  }

  public toJSON(): any {
    return {
      requestBody: {
        requests: this.requests
      },
      spreadsheetId: this.spreadsheetId
    }
  }

  private makeRandomSheetId() {
    let sheetId = random.int(0, 2147483647)
    while (this._sheetIds[sheetId]) {
      sheetId = random.int(0, 2147483647)
    }

    this._sheetIds[sheetId] = 1
    return sheetId
  }
}

export = SpreadsheetRevisionQueue
