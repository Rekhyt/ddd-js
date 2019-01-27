const assert = require('assert')
const chai = require('chai')
chai.should()

const StringValue = require('../../../src/ValueObject/StringValue')
const InvalidArgumentError = require('../../../src/ValueObject/Error/InvalidArgumentError')
const InvalidTypeError = require('../../../src/ValueObject/Error/InvalidTypeError')

describe('StringValue', () => {
  describe('constructor', () => {
    it('should construct an object if a string is passed', () => {
      const stringValue = new StringValue('test')

      assert.strictEqual(stringValue.getValue(), 'test')
    })

    it('should construct an object if an empty string is passed and the allowEmpty flag is "true"', () => {
      const stringValue = new StringValue('', true)

      assert.strictEqual(stringValue.getValue(), '')
    })

    it('should throw an InvalidArgumentError if an empty string is passed and the allowEmpty flag is "false"', () => {
      let stringValue
      let fail = false

      try {
        stringValue = new StringValue('')
        fail = true
      } catch (err) {
        err.should.be.an.instanceOf(InvalidArgumentError)
      }

      assert.strictEqual(stringValue, undefined)
      assert.strictEqual(fail, false)
    })

    it('should throw an InvalidTypeError if an empty string is passed and the allowEmpty flag is "false"', () => {
      let stringValue
      let fail = false

      try {
        stringValue = new StringValue(123)
        fail = true
      } catch (err) {
        err.should.be.an.instanceOf(InvalidTypeError)
      }

      assert.strictEqual(stringValue, undefined)
      assert.strictEqual(fail, false)
    })
  })

  describe('getValue', () => {
    it('should return the exact string that was passed in the constructor', () => {
      const stringValue = new StringValue('test')

      assert.strictEqual(stringValue.getValue(), 'test')
    })
  })

  describe('toString', () => {
    it('should return the exact string that was passed in the constructor', () => {
      const stringValue = new StringValue('test')

      assert.strictEqual(stringValue.toString(), 'test')
    })
  })

  describe('equals', () => {
    it('should return true when a StringValue with the same string is passed', () => {
      const stringValue1 = new StringValue('test')
      const stringValue2 = new StringValue('test')

      assert.strictEqual(stringValue1.equals(stringValue1), true)
      assert.strictEqual(stringValue1.equals(stringValue2), true)
      assert.strictEqual(stringValue2.equals(stringValue1), true)
      assert.strictEqual(stringValue2.equals(stringValue2), true)
    })
  })
})
