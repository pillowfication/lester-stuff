/**
 * Optimized to only care about first and last name
 */

const fixUtf8 = require('fix-utf8')
const unorm = require('unorm')
const baseParseName = require('@pf-n/parse-name')

const PARSE_FAILURE = '__PARSE_FAILURE__'

function clean (name) {
  return unorm.nfkd(fixUtf8(name)).replace(/[\u0300-\u036F]/g, '')
}

const parseNameCache = {}
function parseName (name) {
  if (parseNameCache[name]) {
    return parseNameCache[name]
  }

  let parsedName
  try {
    const { firstName, lastName } = baseParseName(clean(name))
    parsedName = firstName + '||' + lastName
  } catch (err) {
    parsedName = PARSE_FAILURE
  }

  parseNameCache[name] = parsedName
  return parsedName
}

function nameMatches (name1, name2) {
  const parsed1 = parseName(name1)
  if (parsed1 === PARSE_FAILURE) {
    return false
  }

  const parsed2 = parseName(name2)
  if (parsed2 === PARSE_FAILURE) {
    return false
  }

  return parsed1 === parsed2
}

module.exports = nameMatches
