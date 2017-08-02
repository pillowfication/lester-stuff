const fs = require('fs')
const path = require('path')
const readline = require('readline')
const csvStringify = require('csv-stringify')

function toCsv (input, output) {
  if (!input) {
    throw new Error('No input provided')
  }
  input = path.join(__dirname, input)
  const inputParse = path.parse(input)
  output = output
    ? path.join(__dirname, output)
    : path.join(inputParse.dir, `${inputParse.name}.csv`)

  const lineReader = readline.createInterface({
    input: fs.createReadStream(input)
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
        throw error
      }
      fs.writeFileSync(output, csv)
    })
  })
}

if (require.main === module) {
  const input = process.argv[2]
  const output = process.argv[3]
  toCsv(input, output)
}

module.exports = {
  toCsv
}
