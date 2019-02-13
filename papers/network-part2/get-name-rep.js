const equivNames = require('./equiv-names.json')

const cache = {}
for (const rep in equivNames) {
  const equivClass = equivNames[rep]
  equivClass.unshift(rep)
  for (const member of equivClass) {
    cache[member] = rep
  }
}

function getNameRep (name) {
  return cache[name] || name
}

function getNameClass (name) {
  return equivNames[getNameRep(name)] || [ name ]
}

module.exports = {
  getNameRep,
  getNameClass
}
