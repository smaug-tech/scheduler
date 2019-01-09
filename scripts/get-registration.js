const getSheets = require('./get-sheets')

const spreadsheetId = '15rMCbh2BA0CJ0jSCYQI-j3v3YCFF9h8EUe9SOYfvwGw'
const ranges = ['Responses for Edit', 'Mikol'] // Sheet title
const filename = 'remote/registration.json'

module.exports = function getEnrollment() {
  return getSheets(spreadsheetId, filename, {ranges})
}
