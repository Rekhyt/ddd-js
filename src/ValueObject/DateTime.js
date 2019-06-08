const InvalidArgumentError = require('../GenericErrors/InvalidArgumentError')

class DateTime {
  /**
   * @param {string} dateTimeString
   */
  constructor (dateTimeString) {
    const date = new Date(dateTimeString)

    try {
      date.toISOString()
    } catch (err) {
      throw new InvalidArgumentError(`Provided string is not a parsable date: ${date}`)
    }

    this.date = date
  }

  /**
   * @returns {string}
   */
  toISOString () {
    return this.date.toISOString()
  }

  /**
   * @returns {Date}
   */
  getValue () {
    return this.date
  }
}

module.exports = DateTime
