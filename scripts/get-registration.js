const getSheets = require('./get-sheets')

const spreadsheetId = '15ShmuUohScX-qNdW9x61Klo8KgTOS1sfK_3Hgrqab8k'
const ranges = ['Working Student Course Load', 'USE ME - Teaching Assignments'] // Sheet title
const filename = 'remote/registration.json'

module.exports = function getEnrollment() {
  return getSheets(spreadsheetId, filename, {ranges})
}
