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
        { fieldName: 'phone', messages: [{ locale: 'de-de', message: 'not a valid phone number' }] },
        { fieldName: 'email', messages: [{ locale: 'de-de', message: 'not a valid email address' }] }
      ]
      const err = new ValidationError(invalidFields)

      assert.deepStrictEqual(err.invalidFields, invalidFields)
    })
  })

  describe('addInvalidField', () => {
    it('should add an invalid field to the list', () => {
      const invalidFields = [
        { fieldName: 'phone', messages: [{ locale: 'en-us', message: 'not a valid phone number' }] },
        { fieldName: 'email', messages: [{ locale: 'en-us', message: 'not a valid email address' }] }
      ]

      const newInvalidField = {
        fieldName: 'name',
        messages: [
          {
            locale: 'en-us',
            message: 'cannot be empty'
          },
          {
            locale: 'de-de',
            message: 'darf nicht leer sein'
          }
        ]
      }

      const err = new ValidationError(invalidFields)
      err.addInvalidField(newInvalidField)

      assert.deepStrictEqual(err.invalidFields, [...invalidFields, newInvalidField])
    })
  })

  describe('message', () => {
    it('should return a message containing a list of invalid fields', () => {
      const invalidFields = [
        { fieldName: 'phone', messages: [{ locale: 'en-us', message: 'not a valid phone number' }] },
        { fieldName: 'email', messages: [{ locale: 'en-us', message: 'not a valid email address' }] }
      ]

      const err = new ValidationError(invalidFields)

      err.message.should.be.a('string').that.contains('phone, email')
    })
  })

  describe('invalidFields', () => {
    it('should return the list of invalid fields', () => {
      const invalidFields = [
        { fieldName: 'phone', messages: [{ locale: 'en-us', message: 'not a valid phone number' }] },
        { fieldName: 'email', messages: [{ locale: 'en-us', message: 'not a valid email address' }] }
      ]

      const newInvalidField = {
        fieldName: 'name',
        messages: [
          {
            locale: 'en-us',
            message: 'cannot be empty'
          },
          {
            locale: 'de-de',
            message: 'darf nicht leer sein'
          }
        ]
      }

      const err = new ValidationError(invalidFields)
      err.addInvalidField(newInvalidField)

      assert.deepStrictEqual(err.invalidFields, [...invalidFields, newInvalidField])
    })
  })
})
