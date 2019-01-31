const assert = require('assert')

const EmailAddress = require('../../../src/ValueObject/EmailAddress')
const InvalidArgumentError = require('../../../src/GenericErrors/InvalidArgumentError')

describe('StringValue', () => {
  describe('constructor', () => {
    it('should construct an object if a valid email address is passed', () => {
      const expectedEmail = 'no-reply@weird-webdesign.com'
      const stringValue = new EmailAddress(expectedEmail)

      assert.strictEqual(stringValue.getValue(), expectedEmail)
    })

    it('should throw an InvalidArgumentError if a string that is no email address is passed', () => {
      let stringValue
      let fail = false

      try {
        stringValue = new EmailAddress('not-an-email@address')
        fail = true
      } catch (err) {
        err.should.be.an.instanceOf(InvalidArgumentError)
      }

      assert.strictEqual(stringValue, undefined)
      assert.strictEqual(fail, false)
    })
  })
})
