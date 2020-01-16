const assert = require('assert')
const chai = require('chai')
chai.should()

const OutdatedEntityError = require('../../../src/GenericErrors/OutdatedEntityError')

describe('OutdatedEntityError', () => {
  describe('constructor', () => {
    it('should construct an error with the message reflecting which entities failed', () => {
      const err = new OutdatedEntityError([
        { constructor: { name: 'SomeEntity' } },
        { constructor: { name: 'SomeOtherEntity' } }
      ])

      err.message.should.be.a('string').that.equals('Affected entities changed during processing: SomeEntity,SomeOtherEntity')
    })
  })
})
