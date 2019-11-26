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
    const affectedEntities = [...new Set(this._errors.map(e => e.entityName))]
    return `Errors on entit${affectedEntities.length === 1 ? 'y' : 'ies'} ${affectedEntities.join(', ')}`
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
