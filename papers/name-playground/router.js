const path = require('path')
const express = require('express')
const router = express.Router()

const ENTRY = path.resolve(__dirname, './dist/index.html')

router.use(express.static(path.resolve(__dirname, './dist')))
router.get('*', (req, res) => {
  res.sendFile(ENTRY)
})

module.exports = router
