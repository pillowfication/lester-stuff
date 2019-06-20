const request = require('request')
const cheerio = require('cheerio')

function requestGet (url) {
  return new Promise((resolve, reject) => {
    request.get(url, (error, response, body) => {
      if (error || !body) {
        reject(error || new Error(`Could not load url: ${url}`))
      } else {
        resolve(body)
      }
    })
  })
}

module.exports = async function getPage (url) {
  const html = await requestGet(url)
  return cheerio.load(html)
}
