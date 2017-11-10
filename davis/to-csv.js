const util = require('util')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const csvStringify = require('csv-stringify')

function toCsv (inputPath, outputPath, callback) {
  if (!inputPath) {
    return callback(new Error('No input provided'))
  }
  const inputParse = path.parse(inputPath)
  outputPath = outputPath || path.join(inputParse.dir, `${inputParse.name}.csv`)

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
        callback(new Error('No input provided'))
      } else {
        fs.writeFileSync(outputPath, csv)
        callback(null)
      }
    })
  })
}

module.exports = util.promisify(toCsv)
