const fs = require('fs')
const path = require('path')

const textFile = fs.readFileSync(path.resolve(__dirname, './websites.txt'))
const textRows = textFile.toString().split('\n')
textRows.pop()

const header = textRows.shift().split('|')
const rows = textRows.map(row => {
  const data = row.split('|')
  const datum = {}
  for (let index = 0; index < header.length; ++index) {
    datum[header[index]] = data[index]
  }
  return datum
})

console.log(rows)
