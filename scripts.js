// The same Promise API, everywhere.
global.Promise = require('Bluebird')

const getAssignments = require('./scripts/get-assignments')
const getRegistration = require('./scripts/get-registration')
const putSheets = require('./scripts/put-sheets')

module.exports = {
  predist: 'rm -rf dist && run test',
  dist: 'tslint --project . ; tsc',
  test: 'mocha --require ts-node/register --watch-extensions ts,tsx test/*.test.ts test/**/*.test.ts',

  // ---------------------------------------------------------------------------
  // Remote Data

  preget: 'mkdir -p remote/assignments && mkdir -p updates',
  get: (key) => {
    switch (key && `${key.trim()}` || 'all') {
      case 'assignments': {
        return getAssignments()
      }

      case 'registration': {
        return getRegistration()
      }

      case 'all': {
        return getRegistration().then(getAssignments)
      }

      default: {
        console.error(`get: Unknown key '${key}'`)
        process.exit(1)
      }
    }
  },

  put: putSheets,
  postput: 'rm -f updates/*',

  // ---------------------------------------------------------------------------
  // Production

  schedule: (...argv) => {
    require('./dist/cli/schedule')({argv, remote: `${__dirname}/remote`})
  },

  predivvy: 'run get',
  divvy: 'run schedule -- divvy',
  postdivvy: 'run put',

  preremix: 'run get',
  remix: 'run schedule -- remix',
  postremix: 'run put',

  // ---------------------------------------------------------------------------
  // Development
  'dev-schedule': (...argv) => {
    require('ts-node').register({transpileOnly: true})
    require('./src/cli/schedule')({argv, remote: `${__dirname}/remote`})
  }
}
