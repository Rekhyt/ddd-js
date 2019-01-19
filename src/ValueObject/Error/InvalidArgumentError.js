class InvalidArgumentError extends Error {
  /**
   * @param {string} message
   */
  constructor (message) {
    super()
    this.message = message
  }
}

module.exports = InvalidArgumentError
