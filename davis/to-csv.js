const util = require('util')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const csvStringify = require('csv-stringify')

function toCsv (inputPath, cb) {
  if (!inputPath) {
    return cb(new Error('No input provided'))
  }
  const inputParse = path.parse(inputPath)
  const outputPath = path.join(inputParse.dir, `${inputParse.name}.csv`)

  const lineReader = readline.createInterface({
    input: fs.createReadStream(inputPath)
  })

  const columns = { id: 'id' }
  const csv = []

  lineReader.on('line', line => {
    const obj = JSON.parse(line)
    for (const key in obj) {
      !columns[key] && (columns[key] = key)
    }
    csv.push(obj)
  })

  lineReader.on('close', () => {
    csvStringify(csv, { header: true, columns }, (error, csv) => {
      if (error) {
        cb(new Error('No input provided'))
      } else {
        fs.writeFileSync(outputPath, csv)
        cb(null, outputPath)
      }
    })
  })
}

module.exports = util.promisify(toCsv)
