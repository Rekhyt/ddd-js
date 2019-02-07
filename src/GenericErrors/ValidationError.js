class ValidationError extends Error {
  /**
   * @param {InvalidValidationField[]} invalidFields An object of structure invalidFields.<fieldName>.message
   */
  constructor (invalidFields = []) {
    super()

    this._invalidFields = [...invalidFields]
  }

  /**
   * @param {string} fieldName
   * @param {string} message
   */
  addInvalidField (fieldName, message) {
    this._invalidFields.push({ fieldName, message })
  }

  /**
   * @returns {string}
   */
  get message () {
    return `The following fields were invalid: ${this._invalidFields.map(field => field.fieldName).join(', ')}`
  }

  /**
   * @returns {InvalidValidationField[]}
   */
  get invalidFields () {
    return this._invalidFields
  }

  /**
   * @returns {boolean}
   */
  hasErrors () {
    return this._invalidFields.length > 0
  }
}

module.exports = ValidationError
