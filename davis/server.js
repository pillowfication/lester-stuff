const path = require('path')
const express = require('express')
const serveIndex = require('serve-index')

const app = express()
const port = +process.argv[2] || process.env.LESTER_SCRAPE_PORT || 80

app.use('/', express.static(path.join(__dirname, 'data')))
app.use('/', serveIndex(path.join(__dirname, 'data')))

app.listen(port, () => {
  console.log(`App started on port ${port}`)
})
