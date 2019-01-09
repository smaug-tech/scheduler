const fs = Promise.promisifyAll(require('fs'))
const {google} = require('googleapis')
const path = require('path')
const readline = require('readline')
const {EOL: $n} = require('os')

const env = process.env
const homeDirectory = env.HOME || env.HOMEPATH || env.USERPROFILE;

const baseScopeUrl = 'https://www.googleapis.com/auth'
const scopes = ['drive', 'spreadsheets']

const tokensDirectory = path.join(homeDirectory, '.tokens')
const tokensFilename = path.join(tokensDirectory, `${scopes.join('-')}.d-remix.json`)

const credentialsDirectory = path.join(homeDirectory, '.credentials')
const credentialsFilename = path.join(credentialsDirectory, 'credentials_new.json')

const credentials = JSON.parse(fs.readFileSync(credentialsFilename))
const {
  installed: {
    client_secret: clientSecret,
    client_id: clientId,
    redirect_uris: [redirectUri]
  }
} = credentials

const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

module.exports = fs.readFileAsync(tokensFilename).then(JSON.parse).catch(() => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes.map((x) => `${baseScopeUrl}/${x}`)
  })

  const linereader = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log('Authorize this app by visiting the following URL.')
  console.log()
  console.log(authUrl)

  return new Promise(function (resolve, reject) {
    console.log()
    console.log('Then paste the approval code from that page here.')

    linereader.question(`${$n}Code: `, function (code) {
      linereader.close()

      client.getToken(code, function (error, token) {
        if (error) {
          reject(error)
        } else {
          resolve(token)

          fs.mkdirAsync(tokensDirectory, parseInt('0700', 8))
            .catch((error) => { if (error.code !== 'EEXIST') throw error })
            .then(() => fs.writeFileAsync(tokensFilename, JSON.stringify(token)))
            .then(() => console.log(`Token stored in: ${tokensFilename}`))
        }
      })
    })
  })
}).then((token) => {
  client.credentials = token
  return client
})
