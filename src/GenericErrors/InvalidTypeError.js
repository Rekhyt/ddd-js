class InvalidTypeError extends TypeError {
  /**
   * @param {string} expectedType
   * @param {string} actualType
   */
  constructor (expectedType, actualType) {
    super()
    this.message = `Value must be a "${expectedType}", "${actualType}" passed instead.`
  }
}

module.exports = InvalidTypeError
