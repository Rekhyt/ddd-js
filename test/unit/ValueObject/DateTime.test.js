const assert = require('assert')

const DateTime = require('../../../src/ValueObject/DateTime')
const InvalidArgumentError = require('../../../src/GenericErrors/InvalidArgumentError')

describe('DateTime', () => {
  describe('constructor', () => {
    it('should construct an object if a valid date string is passed', () => {
      const expectedDateString = (new Date()).toISOString()
      const dateTime = new DateTime(expectedDateString)

      assert.strictEqual(dateTime.getValue().toISOString(), expectedDateString)
    })

    it('should throw an Error if a string that is no parsable date is passed', () => {
      let dateTime
      let fail = false

      try {
        dateTime = new DateTime('not a date')
        fail = true
      } catch (err) {
        err.should.be.an.instanceOf(InvalidArgumentError)
      }

      assert.strictEqual(dateTime, undefined)
      assert.strictEqual(fail, false)
    })
  })

  describe('toISOString', () => {
    it('should return the expected ISO date string of a date', () => {
      const expectedDateString = (new Date()).toISOString()
      const dateTime = new DateTime(expectedDateString)

      assert.strictEqual(dateTime.toISOString(), expectedDateString)
    })
  })
})
