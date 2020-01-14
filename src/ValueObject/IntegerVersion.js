const InvalidTypeError = require('../GenericErrors/InvalidTypeError')
const InvalidArgumentError = require('../GenericErrors/InvalidArgumentError')

/**
 * @implements {Version}
 */
class IntegerVersion {
  constructor (value) {
    if (Number.isNaN(Number.parseInt(value))) throw new InvalidTypeError('number', typeof value)
    if (!Number.isInteger(value)) throw new InvalidArgumentError(`Provided value is not an integer: ${value}`)

    this._value = value
  }

  /**
   * @returns {IntegerVersion}
   */
  getNextVersion () {
    return new IntegerVersion(this._value + 1)
  }

  /**
   * @returns {number}
   */
  getValue () {
    return this._value
  }

  /**
   * @returns {string}
   */
  toString () {
    return `v${this._value}`
  }

  /**
   * @param {IntegerVersion} version
   * @returns {boolean}
   */
  equals (version) {
    return this._value === version.getValue()
  }
}

module.exports = IntegerVersion
