const getSheets = require('./get-sheets')

const spreadsheetId = '1UHAvsUJ7TkyNgM0AvOYyJWUSvo3YtoqwqnUSKzH3AyA'
const ranges = ['Responses for Edit', 'Mikol'] // Sheet title
const filename = 'remote/registration.json'

module.exports = function getEnrollment() {
  return getSheets(spreadsheetId, filename, {ranges})
}
