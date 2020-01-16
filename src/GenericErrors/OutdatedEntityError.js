class OutdatedEntityError extends Error {
  /**
   * @param {VersionableEntity[]} outdatedEntities
   */
  constructor (outdatedEntities) {
    super()
    this.message = 'Affected entities changed during processing: ' + outdatedEntities.map(e => e.constructor.name)
  }
}

module.exports = OutdatedEntityError
