const path = require('path')
const express = require('express')
const serveIndex = require('serve-index')

const ARCHIVE_PATH = path.resolve(__dirname, './archive')

const app = express()

app.use('/archive', express.static(ARCHIVE_PATH))
app.use('/archive', serveIndex(ARCHIVE_PATH, {
  hidden: true,
  icons: true,
  view: 'details'
}))

app.use((request, response) => { response.sendStatus(404) })

app.listen(3001, () => {
  console.log(`started on port 3001`)
})
