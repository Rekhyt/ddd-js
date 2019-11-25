class SagaError extends Error {
  constructor () {
    super()

    this._errors = []
  }

  /**
   * @param {string} entityName
   * @param {Error} error
   */
  addError (entityName, error) {
    this._errors.push({ entityName, error })
  }

  /**
   * @returns {string}
   */
  get message () {
    return `Errors on entit${this._errors.length === 1 ? 'y' : 'ies'} ${this._errors.map(e => e.entityName).join(', ')}`
  }

  /**
   * @returns {{entityName: string, error: Error}[]}
   */
  get errors () {
    return this._errors
  }

  /**
   * @returns {boolean}
   */
  hasErrors () {
    return this._errors.length > 0
  }
}

module.exports = SagaError
