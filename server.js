const path = require('path')
const express = require('express')
const serveIndex = require('serve-index')

const app = express()
const port = process.argv[2] || process.env.LESTER_SCRAPE_PORT || 80

app.use('/davis', express.static(path.join(__dirname, 'davis', 'data')))
app.use('/davis', serveIndex(path.join(__dirname, 'davis', 'data'), { view: 'details' }))
app.use('/football', express.static(path.join(__dirname, 'football', 'data')))
app.use('/football', serveIndex(path.join(__dirname, 'football', 'data'), { view: 'details' }))

app.listen(port, () => {
  console.log(`lester-scrape started on port ${port}`)
})
