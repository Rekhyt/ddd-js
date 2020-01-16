const IntegerVersion = require('./ValueObject/IntegerVersion')

/**
 * @implements {VersionableEntity}
 * @abstract
 */
class BaseEntity {
  /**
   * @param {IntegerVersion} version
   */
  constructor (version = null) {
    this._version = version || new IntegerVersion(0)
  }

  /**
   * @returns {IntegerVersion}
   */
  get version () {
    return this._version
  }

  versionUp () {
    this._version = this._version.getNextVersion()
  }
}

module.exports = BaseEntity
