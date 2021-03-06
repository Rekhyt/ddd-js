const InvalidTypeError = require('../GenericErrors/InvalidTypeError')
const InvalidArgumentError = require('../GenericErrors/InvalidArgumentError')

class StringValue {
  /**
   * @param {string} value
   * @param {boolean} allowEmpty
   */
  constructor (value, allowEmpty = false) {
    if (!(typeof value === 'string')) {
      throw new InvalidTypeError('string', typeof value)
    }

    if (!allowEmpty && value === '') {
      throw new InvalidArgumentError('Value must not be an empty string.')
    }

    this._value = value
  }

  /**
   * @returns {string}
   */
  getValue () {
    return this._value
  }

  /**
   * @param {StringValue} value
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

module.exports = StringValue
