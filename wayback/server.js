const path = require('path')
const express = require('express')
const serveIndex = require('serve-index')

const ARCHIVE_PATH = 'F:/wayback/archive'
const htmllikeExt = /^((\.html?|\.php|\.aspx?|\.jsp)(\?.*)?)?$/i

const app = express()

app.use((req, res, next) => {
  console.log(req.url)
  next()
})

app.use('/archive', express.static(ARCHIVE_PATH, {
  setHeaders: (res, _path) => {
    const extension = path.extname(_path)
    if (htmllikeExt.test(extension)) {
      res.setHeader('Content-Type', 'text/html')
    }
  }
}))
app.use('/archive', serveIndex(ARCHIVE_PATH, {
  hidden: true,
  icons: true,
  view: 'details'
}))

app.use((request, response) => { response.sendStatus(404) })

app.listen(3001, () => {
  console.log(`started on port 3001`)
})
