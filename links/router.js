const express = require('express')
const router = express.Router()

const LINKS = [
  'http://lester.pf-n.co/davis',
  'http://lester.pf-n.co/football'
]

const cache = {}
let counter = 0

function getLink (ip) {
  const cached = cache[ip]
  if (cached) {
    return LINKS[cached]
  }

  const index = ++counter % LINKS.length
  cached[ip] = index
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
