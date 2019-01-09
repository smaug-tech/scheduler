const fs = Promise.promisifyAll(require('fs'))
const {google} = require('googleapis')

const folderId = '1XUGsx0_fSbDcdDSZ1h8-GxYiQZrubxqm'

module.exports = function initializeAssignments() {
  const emailAddresses = parseEmailAddresses()

  return new Promise((resolve, reject) => {
    require('./auth').then((auth) => {
      google.drive({auth, version: 'v3'}).files
        .list({q: `'${folderId}' in parents and trashed = false`})
        .then(({data: {files}}) => {
          const spreadsheetsByName = files.reduce((accumulator, file) => {
            if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
              accumulator[file.name] = file
            }

            return accumulator
          }, {})

          const spreadsheetFiles = []

          ;(function next(index = 0) {
            if (index < emailAddresses.length) {
              const name = emailAddresses[index].replace(/^([^@]+?)@dtechhs\.org$/, '$1')
              const file = spreadsheetsByName[name]

              if (file) {
                spreadsheetFiles.push(file)
                setTimeout(() => next(++index), 10)
              } else {
                createSpreadsheet(auth, name)
                  .then((spreadsheet) => getSpreadsheetFile(auth, spreadsheet))
                  .then((file) => updateSpreadsheetFile(auth, file))
                  .then((file) => spreadsheetFiles.push(file))
                  .then(() => setTimeout(() => next(++index), 10))
                  .catch(reject)
              }
            } else {
              resolve(spreadsheetFiles)
            }
          }())
        })
      })
  }).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

function createSpreadsheet(auth, name) {
  return google.sheets({auth, version: 'v4'}).spreadsheets
    .create({resource: {properties: {title: name}}})
    .then(({data: {spreadsheetId}}) => spreadsheetId)
}

function getSpreadsheetFile(auth, fileId) {
  const fields = 'id,parents'
  return google.drive({auth, version: 'v3'}).files
    .get({fileId, fields})
    .then(({data}) => data)
}

function updateSpreadsheetFile(auth, file) {
  const fileId = file.id
  const addParents = folderId
  const removeParents = file.parents.join(',')
  return google.drive({auth, version: 'v3'}).files
    .update({fileId, addParents, removeParents}).then(() => file)
}

function parseEmailAddresses() {
  const registration = require('../remote/registration.json')
  const courses = registration.sheets.find((sheet) => sheet.properties.title === 'Mikol')
  const indexOfEmailAddress = courses.values[0].indexOf('Email Address')
  const indexOfExclude = courses.values[0].indexOf('Exclude')
  const seen = {}

  return courses.values.slice(1).reduce((emailAddresses, row) => {
    const include = !row[indexOfExclude]

    if (include) {
      const emailAddress = row[indexOfEmailAddress]

      if (!seen[emailAddress]) {
        seen[emailAddress] = true
        emailAddresses.push(emailAddress)
      }
    }

    return emailAddresses
  }, [])
}
