const BaseEntity = require('../../src/BaseEntity')
const IntegerVersion = require('../../src/ValueObject/IntegerVersion')

const chai = require('chai')
chai.should()

class Impl extends BaseEntity {}

describe('BaseEntity', () => {
  describe('constructor', () => {
    it('should create an entity with a version of 0 if none was passed', () => {
      const entity = new Impl()
      entity.version.getValue().should.equal(0)
    })

    it('should create an entity with the exact same version that was passed', () => {
      const version = new IntegerVersion(22)
      const entity = new Impl(version)
      entity.version.should.equal(version)
    })
  })

  describe('versionUp', () => {
    it('should set the version property to the next version', () => {
      const version = new IntegerVersion(23)

      const entity = new Impl(version)
      entity.versionUp()

      entity.version.getValue().should.equal(24)
    })
  })
})
