const regex = /[,\n"]/

function csvEscape (value) {
  let escaped = String(value).replace('"', '""')
  if (regex.test(escaped)) {
    escaped = '"' + escaped + '"'
  }
  return escaped
}

module.exports = csvEscape
