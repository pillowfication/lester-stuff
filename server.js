const path = require('path')
const express = require('express')
const serveIndex = require('serve-index')

const linksRouter = require('./links/router')
const namePlaygroundRouter = require('./papers/name-playground/router')

const app = express()
const port = process.argv[2] || process.env.LESTER_STUFF_PORT || 80

app.set('trust proxy', 'loopback')

app.use('/davis', express.static(path.join(__dirname, 'davis', 'data')))
app.use('/davis', serveIndex(path.join(__dirname, 'davis', 'data'), { view: 'details' }))
app.use('/football', express.static(path.join(__dirname, 'football', 'data')))
app.use('/football', serveIndex(path.join(__dirname, 'football', 'data'), { view: 'details' }))
app.use('/papers', express.static(path.join(__dirname, 'papers', 'data')))
app.use('/papers', serveIndex(path.join(__dirname, 'papers', 'data'), { view: 'details' }))

app.use('/links', linksRouter)

app.use('/name-playground', namePlaygroundRouter)

app.listen(port, () => {
  console.log(`lester-stuff started on port ${port}`)
})
