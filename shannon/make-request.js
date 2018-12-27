const exec = require('child_process').exec

module.exports = async function makeRequest (url) {
  return new Promise((resolve, reject) => {
    exec(`curl '${url}'`, (err, stdout, stderr) => {
      err ? reject(err) : resolve(stdout)
    })
  })
}
