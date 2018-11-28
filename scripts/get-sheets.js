const fs = Promise.promisifyAll(require('fs'))
const {google} = require('googleapis')

const fields = `\
spreadsheetId,\
properties.title,\
sheets(properties.sheetId,\
properties.index,\
properties.title,\
data.rowData.values(effectiveValue))`

module.exports = function getSheets(spreadsheetId, filename, {ranges} = {}) {
  console.error(`get-sheets: ${filename} [${ranges ? ranges.join(', ') : '*'}]`)
  return require('./auth').then((auth) => {
    return google.sheets({auth, version: 'v4'}).spreadsheets
      .get({spreadsheetId, fields, ranges})
      .then(({data}) => write(filename, parseSpreadsheetData(data)))
  }).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

function parseSpreadsheetData({spreadsheetId, properties: {...properties}, sheets}) {
  return {spreadsheetId, properties, sheets: sheets.map(transformSheet)}
}

function transformSheet({properties, data: [{rowData}]}) {
  return {
    properties,
    values: transformRowData(rowData)
  }
}

function transformRowData(rows = []) {
  return rows.map((row) => {
    if (!row.values) {
      return
    }

    return row.values.map(({effectiveValue}) => {
      for (const key in effectiveValue) {
        return effectiveValue[key]
      }
    })
  })
}

function write(filename, data) {
  return fs.writeFileAsync(filename, JSON.stringify(data, null, 2))
}
