/**
 * @implements EventHandler
 */
class ReadModel {
  /**
   * @param {Logger} logger
   * @param {EventDispatcher} eventDispatcher
   */
  constructor (logger, eventDispatcher) {
    this.logger = logger
    this.eventDispatcher = eventDispatcher
    this.eventHandlerFunctions = {}
  }

  /**
   * @param {string} name
   * @param {Function} func
   */
  registerEvent (name, func) {
    if (this.eventHandlerFunctions[name]) {
      this.logger.error(new Error(`Two functions registered as event handler for ${name}. Keeping the former.`))
      return
    }

    this.eventHandlerFunctions[name] = func
    this.eventDispatcher.subscribe(name, this)

    this.logger.info({
      name,
      aggregateClass: this.constructor.name,
      functionName: func.name
    }, 'Registered handler function for an event.')
  }

  /**
   * @param {Event} event
   * @returns {Event[]}
   */
  apply (event) {
    if (!this.eventHandlerFunctions[event.name]) {
      this.logger.error(new Error(`Cannot apply incoming event ${event.name || 'no name given'}.`))
      return []
    }

    this.logger.debug(
      {
        name: event.name,
        time: event.time,
        payload: JSON.stringify(event.payload, null, 2),
        aggregateClass: this.constructor.prototype
      },
      'Going to apply an event.'
    )
    return this.eventHandlerFunctions[event.name](event)
  }

  /**
   * @param {string} name
   * @param {Object} payload
   * @returns {Event}
   */
  createEvent (name, payload = {}) {
    return {
      name,
      time: new Date().toISOString(),
      payload
    }
  }

}
