const express = require('express')
const router = express.Router()

const LINKS = [
  'http://www.espn.com/',
  'https://www.youtube.com/'
]

const cache = {}
let counter = 0

function getLink (ip) {
  const cached = cache[ip]
  if (cached !== undefined) {
    return LINKS[cached]
  }

  const index = ++counter % LINKS.length
  cache[ip] = index
  return LINKS[index]
}

router.get('/', (request, response) => {
  const link = getLink(request.ip)
  response.redirect(link)
})

router.get('/stats', (request, response) => {
  response.json({ cache, counter })
})

module.exports = router
