const express = require('express')
const expressFingerprint = require('express-fingerprint')
const router = express.Router()

router.use(expressFingerprint({
  parameters: [
    expressFingerprint.useragent,
    expressFingerprint.acceptHeaders,
    expressFingerprint.geoip
  ]
}))

const LINKS = [
  'https://ucdavis.co1.qualtrics.com/jfe/form/SV_23oJCpnoIjypzOl',
  'https://ucdavis.co1.qualtrics.com/jfe/form/SV_3jXU1bw8r4VRvkV'
]

const cache = {}
let counter = 0

function getLink (ip) {
console.log(ip)
  const cached = cache[ip]
  if (cached !== undefined) {
    return LINKS[cached]
  }

  const index = ++counter % LINKS.length
  cache[ip] = index
  return LINKS[index]
}

router.get('/', (request, response) => {
  const link = getLink(request.ip + '|' + request.fingerprint.hash)
  response.redirect(link)
})

router.get('/stats', (request, response) => {
  response.json({ cache, counter })
})

module.exports = router
