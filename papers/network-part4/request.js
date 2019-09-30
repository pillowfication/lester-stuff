const request = require('request')
const MAX_ATTEMPTS = 5

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

module.exports = async function request (url) {
  let lastError = null
  for (let i = 0; i < MAX_ATTEMPTS; ++i) {
    try {
      return await requestGet(url)
    } catch (err) {
      lastError = err
    }
  }
  return lastError
}
