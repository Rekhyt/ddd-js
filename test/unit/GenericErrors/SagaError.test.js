const assert = require('assert')
const chai = require('chai')
chai.should()

const SagaError = require('../../../src/GenericErrors/SagaError')

describe('SagaError', () => {
  describe('constructor', () => {
    it('should construct an empty error when no parameters passed', () => {
      const err = new SagaError()

      assert.deepStrictEqual(err.errors, [])
    })
  })

  describe('addError', () => {
    it('should add an error to the list', () => {
      const error1 = new Error('Closed during requested period')
      const error2 = new Error('Room already booked')
      const error3 = new Error('Internal error at car service')
      const error4 = new Error('Flight cancelled')

      const err = new SagaError()
      err.addError('Hotel', error1)
      err.addError('Hotel', error2)
      err.addError('Car', error3)
      err.addError('Plane', error4)

      assert.deepStrictEqual(err.errors, [
        { entityName: 'Hotel', error: error1 },
        { entityName: 'Hotel', error: error2 },
        { entityName: 'Car', error: error3 },
        { entityName: 'Plane', error: error4 }
      ])
    })
  })

  describe('message', () => {
    it('should return a message containing the entity the error occured on', () => {
      const error1 = new Error('Closed during requested period')

      const err = new SagaError()
      err.addError('Hotel', error1)

      err.message.should.be.a('string').that.contains('entity').and.that.contains('Hotel')
    })

    it('should return a message containing the entities the error occured on', () => {
      const error1 = new Error('Closed during requested period')
      const error2 = new Error('Room already booked')
      const error3 = new Error('Internal error at car service')
      const error4 = new Error('Flight cancelled')

      const err = new SagaError()
      err.addError('Hotel', error1)
      err.addError('Hotel', error2)
      err.addError('Car', error3)
      err.addError('Plane', error4)

      err.message.should.be.a('string').that.contains('entities').and.that.contains('Hotel, Car, Plane')
    })
  })

  describe('hasErrors', () => {
    it('should return false when no errors were ever added', () => {
      assert.strictEqual(new SagaError().hasErrors(), false)
    })

    it('should return true when errors were added', () => {
      const err = new SagaError()
      err.addError('Hotel', new Error('Closed during requested period'))

      assert.strictEqual(err.hasErrors(), true)
    })
  })
})
