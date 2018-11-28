const {google} = require('googleapis')

const initializeAssignments = require('./initialize-assignments')
const getSheets = require('./get-sheets')

module.exports = function getAssignments() {
  return initializeAssignments().then((files) => {
    files.push({
      id: '1PzN9Zsh7QJzhOu3wz73_D-7eBIACCvhq1eexBeUPLW8',
      name: '00-master-schedule'
    })

    return require('./auth').then((auth) => {
      return new Promise((resolve, reject) => {
        ;(function next(index = 0) {
          if (index < files.length) {
            const {id: spreadsheetId, name} = files[index]
            getSheets(spreadsheetId, `remote/assignments/${name}.json`)
              .then(() => setTimeout(() => next(++index), 10))
              .catch(reject)
          } else {
            resolve()
          }
        }())
      })
    })
  })
}
