const fs = require('fs')
const path = require('path')
const csvParse = require('csv-parse/lib/sync')

const STUDENTS_FILE = path.resolve(__dirname, './data/student_names.csv')
const RESULTS_FILE = path.resolve(__dirname, './data/results.json')

const studentNames = csvParse(fs.readFileSync(STUDENTS_FILE), { columns: true })
let results = fs.readFileSync(RESULTS_FILE).toString().split('\n')
results.pop()
results = results.map(result => JSON.parse(result))

const resultsMap = {}
for (const result of results) {
  resultsMap[result.student.newid] = result
}

for (const student of studentNames) {
  if (!resultsMap[student.newid]) {
    console.log(`No result found for ${student.newid} | ${student.first} ${student.juhylast}`)
  }
}
