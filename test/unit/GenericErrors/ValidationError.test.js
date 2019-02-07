const assert = require('assert')
const chai = require('chai')
chai.should()

const ValidationError = require('../../../src/GenericErrors/ValidationError')

describe('ValidationError', () => {
  describe('constructor', () => {
    it('should construct an empty error when no parameters passed', () => {
      const err = new ValidationError()

      assert.deepStrictEqual(err.invalidFields, [])
    })

    it('should construct an error with invalid fields if passed', () => {
      const invalidFields = [
        { fieldName: 'phone', message: 'not a valid phone number' },
        { fieldName: 'email', message: 'not a valid email address' }
      ]
      const err = new ValidationError(invalidFields)

      assert.deepStrictEqual(err.invalidFields, invalidFields)
    })
  })

  describe('addInvalidField', () => {
    it('should add an invalid field to the list', () => {
      const invalidFields = [
        { fieldName: 'phone', message: 'not a valid phone number' },
        { fieldName: 'email', message: 'not a valid email address' }
      ]

      const newInvalidField = { fieldName: 'name', message: 'cannot be empty' }

      const err = new ValidationError(invalidFields)
      err.addInvalidField('name', 'cannot be empty')

      assert.deepStrictEqual(err.invalidFields, [...invalidFields, newInvalidField])
    })
  })

  describe('message', () => {
    it('should return a message containing a list of invalid fields', () => {
      const invalidFields = [
        { fieldName: 'phone', message: 'not a valid phone number' },
        { fieldName: 'email', message: 'not a valid email address' }
      ]

      const err = new ValidationError(invalidFields)

      err.message.should.be.a('string').that.contains('phone, email')
    })
  })

  describe('invalidFields', () => {
    it('should return the list of invalid fields', () => {
      const invalidFields = [
        { fieldName: 'phone', message: 'not a valid phone number' },
        { fieldName: 'email', message: 'not a valid email address' }
      ]

      const newInvalidField = { fieldName: 'name', message: 'cannot be empty' }

      const err = new ValidationError(invalidFields)
      err.addInvalidField('name', 'cannot be empty')

      assert.deepStrictEqual(err.invalidFields, [...invalidFields, newInvalidField])
    })
  })

  describe('hasErrors', () => {
    it('should return false when no errors were ever added', () => {
      assert.strictEqual(new ValidationError().hasErrors(), false)
    })

    it('should return true when initialized with errors', () => {
      assert.strictEqual(
        new ValidationError([{ fieldName: 'phone', message: 'not a valid phone number' }]).hasErrors(),
        true
      )
    })

    it('should return true when errors were added', () => {
      const err = new ValidationError()
      err.addInvalidField('phone', 'not a valid phone number')

      assert.strictEqual(err.hasErrors(), true)
    })
  })
})
