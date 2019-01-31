class ValidationError extends Error {
  /**
   * @param {InvalidValidationField[]} invalidFields An object of structure invalidFields.<fieldName>.message
   */
  constructor (invalidFields = []) {
    super()

    this._invalidFields = invalidFields
  }

  /**
   * @param {InvalidValidationField} invalidField
   */
  addInvalidField (invalidField) {
    this._invalidFields.push(invalidField)
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
}

module.exports = ValidationError
