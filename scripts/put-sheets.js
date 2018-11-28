const fs = require('fs')
const {google} = require('googleapis')
const path = require('path')

const updates = fs.readdirSync('updates')
  .reduce((accumulator, basename) => {
    const filename = `updates/${basename}`
    accumulator[filename] = require(`${path.relative(__dirname, process.cwd())}/${filename}`)
    return accumulator
  }, {})

module.exports = function putSheets() {
  return require('./auth').then((auth) => {
    const filenames = Object.keys(updates)
    return new Promise((resolve, reject) => {
      ;(function next(index = 0) {
        if (index < filenames.length) {
          const filename = filenames[index]
          console.error(`put-sheets: ${filename}`)
          google.sheets({auth, version: 'v4'}).spreadsheets
            .batchUpdate(updates[filename])
            .then(() => setTimeout(() => next(++index), 10))
            .catch(reject)
        } else {
          resolve()
        }
      }())
    })
  }).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
// module.exports = function putSheets() {
//   return require('./auth').then((auth) => {
//     const promises = Object.keys(updates).map((filename) => {
//       console.error(`put-sheets: ${filename}`)
//
//       return google.sheets({auth, version: 'v4'}).spreadsheets
//         .batchUpdate(updates[filename])
//     })
//
//     return Promise.all(promises)
//   }).catch((error) => {
//     console.error(error)
//     process.exit(1)
//   })
// }
