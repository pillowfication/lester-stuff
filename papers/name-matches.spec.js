const expect = require('chai').expect
const nameMatches = require('./name-matches')

/**
 * NOTE: This relation is reflexive and symmetric, but not transitive
 */

// Checks for first and last name to match
expect(nameMatches('Markus Tran', 'Markus Tran')).to.be.true
expect(nameMatches('Markus Tran', 'Markus T.')).to.be.true
expect(nameMatches('Markus Tran', 'M. Tran')).to.be.true
expect(nameMatches('Markus Tran', 'M. T.')).to.be.true

expect(nameMatches('Markus Tran', 'Marcus Tran')).to.be.false
expect(nameMatches('Markus Tran', 'MarkusTran')).to.be.false
expect(nameMatches('Markus Tran', 'Markus DominionGod')).to.be.false
expect(nameMatches('Markus Tran', 'Tran Markus')).to.be.false

// If only one name is found, it is expected to be a last name
expect(nameMatches('Markus Tran', 'Tran')).to.be.true
expect(nameMatches('Tran', 'T.')).to.be.true

expect(nameMatches('Markus Tran', 'Markus')).to.be.false

// Checks for middle names to match if present in both names
expect(nameMatches('Markus Khoa Tran', 'Markus Khoa Tran')).to.be.true
expect(nameMatches('Markus Khoa Tran', 'Markus K. Tran')).to.be.true
expect(nameMatches('Markus Khoa Tran', 'Markus Tran')).to.be.true

expect(nameMatches('Markus Khoa Tran', 'Markus Poop Tran')).to.be.false
expect(nameMatches('Markus Khoa Tran', 'Markus Khoa Poop Tran')).to.be.false

// Ignores suffixes and prefixes and nicknames
expect(nameMatches('Markus Tran', 'Dr. Markus Tran')).to.be.true
expect(nameMatches('Markus Tran Sr.', 'Markus Tran Jr.')).to.be.true
expect(nameMatches('Markus Tran', 'Mr. Dr. Prof. Markus "Mangkus" Tran Jr. III Ph.D. (deceased)')).to.be.true

// Different name formats are supported
expect(nameMatches('Markus Tran', 'Tran, Markus')).to.be.true
expect(nameMatches('Markus Khoa Tran', 'Dr. Tran, Markus K.')).to.be.true

// Case is ignored
expect(nameMatches("Markus du'Tran", "mArKuS Du'TrAn")).to.be.true

// Periods in prefixes, suffixes, and name abbreviations are ignored
expect(nameMatches('Mr. Markus Tran', 'Mr Markus Tran')).to.be.true
expect(nameMatches('M. K. Tran', 'M K Tran')).to.be.true

// `de...` and variants are part of the last name (is not ignored like a middle name)
// Note: `van den...` is treated like a middle name due a bug in the package I'm using
// (https://github.com/dschnelldavis/parse-full-name/issues/12)
expect(nameMatches('Markus Tran', 'Markus Van Tran')).to.be.false
expect(nameMatches('Markus Tran', 'Markus van de Tran')).to.be.false
expect(nameMatches('Markus Tran', 'Markus van der Tran')).to.be.false
// expect(nameMatches('Markus Tran', 'Markus van den Tran')).to.be.false
expect(nameMatches('Markus Tran', 'Markus de la Tran')).to.be.false

// Unknown and non-abbreviated titles and parsed as names
expect(nameMatches('Markus Tran', 'Mister Markus Tran')).to.be.false
expect(nameMatches('Markus Tran', 'Super Programmer Markus Tran')).to.be.false

// Non-language characters are removed before parsing
// Note: This does remove characters `-` and `'`
// (with character matching as defined in http://xregexp.com/plugins/)
expect(nameMatches('Markus Tran', "Markus t'Ran")).to.be.true
expect(nameMatches('Markus Tran-Ryan', 'Markus Tranryan')).to.be.true
expect(nameMatches('Markus Tran', "_Mar-Kus420$ t'Ran!!!")).to.be.true

expect(nameMatches('Märküs Trần', 'Mrks Trn')).to.be.false

// Spaces are collapsed and leading/trailing spaces ignored
expect(nameMatches('Markus Tran', 'Markus     Tran')).to.be.true
expect(nameMatches('Markus Tran', '    Markus Tran  ')).to.be.true
