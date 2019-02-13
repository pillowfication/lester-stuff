const fixUtf8 = require('fix-utf8')
const unorm = require('unorm')
const baseParseName = require('@pf-n/parse-name')

const parseNameCache = {}
function parseName (name) {
  if (parseNameCache[name]) {
    return parseNameCache[name]
  }
  const parsedName = baseParseName(clean(name))
  parseNameCache[name] = parsedName
  return parsedName
}

function clean (name) {
  return unorm.nfkd(fixUtf8(name)).replace(/[\u0300-\u036F]/g, '')
}

function nameMatches (name1, name2) {
  try {
    const { firstName: first1, lastName: last1 } = parseName(name1)
    const { firstName: first2, lastName: last2 } = parseName(name2)

    return first1 === first2 && last1 === last2
  } catch (err) {
    return false
  }
}

module.exports = nameMatches
