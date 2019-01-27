const assert = require('assert')

const Enum = require('../../../src/ValueObject/Enum')
const InvalidArgumentError = require('../../../src/ValueObject/Error/InvalidArgumentError')

const EnumEmpty = class extends Enum {}
const EnumImpl = class extends Enum {
  getEnumValues () {
    return ['value1', 'value2', 'value3']
  }
}

describe('StringValue', () => {
  describe('constructor', () => {
    it('should throw an Error when getValues() is not implemented', () => {
      let enumObject
      let fail = false

      try {
        enumObject = new EnumEmpty('test123')
        fail = true
      } catch (err) {
        assert.strictEqual(err.message, 'Enums must implement their own getEnumValues() method.')
      }

      assert.strictEqual(enumObject, undefined)
      assert.strictEqual(fail, false)
    })

    it('should throw an InvalidArgumentError if a string that is no enum value is passed', () => {
      let enumObject
      let fail = false

      try {
        enumObject = new EnumImpl('test123')
        fail = true
      } catch (err) {
        err.should.be.an.instanceOf(InvalidArgumentError)
      }

      assert.strictEqual(enumObject, undefined)
      assert.strictEqual(fail, false)
    })

    it('should create an object if a string is passed that is an enum value', () => {
      const enum1 = new EnumImpl('value1')
      const enum2 = new EnumImpl('value2')
      const enum3 = new EnumImpl('value3')

      assert.strictEqual(enum1.getValue(), 'value1')
      assert.strictEqual(enum2.getValue(), 'value2')
      assert.strictEqual(enum3.getValue(), 'value3')
    })
  })

  describe('getValue', () => {
    it('should return the exact string that was passed in the constructor', () => {
      const enum1 = new EnumImpl('value1')
      const enum2 = new EnumImpl('value2')
      const enum3 = new EnumImpl('value3')

      assert.strictEqual(enum1.getValue(), 'value1')
      assert.strictEqual(enum2.getValue(), 'value2')
      assert.strictEqual(enum3.getValue(), 'value3')
    })
  })

  describe('toString', () => {
    it('should return the exact string that was passed in the constructor', () => {
      const enum1 = new EnumImpl('value1')
      const enum2 = new EnumImpl('value2')
      const enum3 = new EnumImpl('value3')

      assert.strictEqual(enum1.toString(), 'value1')
      assert.strictEqual(enum2.toString(), 'value2')
      assert.strictEqual(enum3.toString(), 'value3')
    })
  })

  describe('equals', () => {
    it('should return true when a StringValue with the same string is passed', () => {
      const enum1 = new EnumImpl('value1')
      const enum2 = new EnumImpl('value1')

      assert.strictEqual(enum1.equals(enum1), true)
      assert.strictEqual(enum1.equals(enum2), true)
      assert.strictEqual(enum2.equals(enum1), true)
      assert.strictEqual(enum2.equals(enum2), true)
    })
  })
})
