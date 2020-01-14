const assert = require('assert')
const chai = require('chai')
chai.should()

const IntegerVersion = require('../../../src/ValueObject/IntegerVersion')
const InvalidArgumentError = require('../../../src/GenericErrors/InvalidArgumentError')
const InvalidTypeError = require('../../../src/GenericErrors/InvalidTypeError')

describe('StringValue', () => {
  describe('constructor', () => {
    it('should construct an object if an integer is passed', () => {
      const integerVersion = new IntegerVersion(123)

      assert.strictEqual(integerVersion.getValue(), 123)
    })

    it('should throw an InvalidTypeError if the Number.parseInt(value) evaluates to NaN', () => {
      (() => new IntegerVersion('abc')).should.throw(InvalidTypeError)
    })

    it('should throw an InvalidArgumentError if the passed number is not an integer', () => {
      (() => new IntegerVersion(22.8)).should.throw(InvalidArgumentError)
    })
  })

  describe('getValue', () => {
    it('should return the exact number that was passed in the constructor', () => {
      const integerVersion = new IntegerVersion(1337)
      assert.strictEqual(integerVersion.getValue(), 1337)
    })
  })

  describe('toString', () => {
    it('should return the the number that was passed in the constructor as a string', () => {
      const integerVersion = new IntegerVersion(1337)

      assert.strictEqual(integerVersion.toString(), 'v1337')
    })
  })

  describe('equals', () => {
    it('should return true when an IntegerVersion with the same number is passed', () => {
      const integerVersion1 = new IntegerVersion(23)
      const integerVersion2 = new IntegerVersion(23)

      assert.strictEqual(integerVersion1.equals(integerVersion1), true)
      assert.strictEqual(integerVersion1.equals(integerVersion2), true)
      assert.strictEqual(integerVersion2.equals(integerVersion1), true)
      assert.strictEqual(integerVersion2.equals(integerVersion2), true)
    })
  })

  describe('getNextVersion', () => {
    it('should return a new IntegerVersion with the own value incremented by 1', () => {
      const version = new IntegerVersion(34)
      const nextVersion = version.getNextVersion()

      nextVersion.getValue().should.be.a('number').that.equals(35)
      nextVersion.should.not.equal(version)
    })
  })
})
