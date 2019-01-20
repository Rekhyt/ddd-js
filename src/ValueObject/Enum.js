const InvalidArgumentError = require('./Error/InvalidArgumentError')

class Enum {
  /**
   * @param {string} value
   */
  constructor (value) {
    if (!this.getEnumValues().includes(value)) {
      throw new InvalidArgumentError(`Unknown enum value "${value}", must be one of ${this.getEnumValues().join(', ')}`)
    }

    this._value = value
  }

  /**
   * @returns {string[]}
   */
  getEnumValues () {
    throw new InvalidArgumentError('Enums must implement their own getEnumValues() method.')
  }

  /**
   * @returns {string}
   */
  getValue () {
    return this._value
  }

  /**
   * @param {Enum} value
   * @returns {boolean}
   */
  equals (value) {
    return this._value === value.getValue()
  }

  /**
   * @returns {string}
   */
  toString () {
    return this._value
  }
}

module.exports = Enum
