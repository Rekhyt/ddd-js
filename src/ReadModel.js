/**
 * @implements EventHandler
 * @abstract
 */
class ReadModel {
  /**
   * @param {Logger} logger
   * @param {EventDispatcher} eventDispatcher
   */
  constructor (logger, eventDispatcher) {
    this.logger = logger
    this._eventDispatcher = eventDispatcher
    this._eventHandlerFunctions = {}
  }

  /**
   * @param {string} name
   * @param {Function} func
   */
  registerEvent (name, func) {
    if (this._eventHandlerFunctions[name]) {
      this.logger.error(new Error(`Two functions registered as event handler for ${name}. Keeping the former.`))
      return
    }

    this._eventHandlerFunctions[name] = func
    this._eventDispatcher.subscribe(name, this)

    this.logger.info({
      eventName: name,
      readModel: this.constructor.name,
      functionName: func.toString()
    }, 'Registered handler function for an event.')
  }

  /**
   * @returns {object} with event names as keys and handler functions as values
   */
  get eventHandlerFunctions () {
    return this._eventHandlerFunctions
  }

  /**
   * @param {Event} event
   */
  async apply (event) {
    if (!this._eventHandlerFunctions[event.name]) {
      /* istanbul ignore next */
      this.logger.error(new Error(`Cannot apply incoming event ${event.name || 'no name given'}.`))
      return
    }

    this.logger.debug(
      {
        eventName: event.name,
        eventTime: event.time,
        eventPayload: JSON.stringify(event.payload, null, 2),
        readModel: this.constructor.prototype
      },
      'Going to apply an event.'
    )
    await this._eventHandlerFunctions[event.name](event)
  }
}

module.exports = ReadModel
