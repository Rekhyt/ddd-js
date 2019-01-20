/**
 * @implements CommandHandler
 * @implements EventHandler
 */
class Entity {
  /**
   * @param {Logger} logger
   * @param {CommandDispatcher} commandDispatcher
   * @param {EventDispatcher} eventDispatcher
   */
  constructor (logger, commandDispatcher, eventDispatcher) {
    this.logger = logger
    this.commandDispatcher = commandDispatcher
    this.eventDispatcher = eventDispatcher
    this.commandHandlerFunctions = {}
    this.eventHandlerFunctions = {}
  }

  /**
   * @param {string} name
   * @param {Function} func
   */
  registerCommand (name, func) {
    if (this.commandHandlerFunctions[name]) {
      this.logger.error(
        new Error(`Two functions registered as command handler for ${name}. Keeping the former.`)
      )
      return
    }

    this.commandHandlerFunctions[name] = func
    this.commandDispatcher.subscribe(name, this)

    this.logger.info({
      name,
      aggregateClass: this.constructor.name,
      functionName: func.name
    }, 'Registered handler function for a command.')
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
   * @param {Command} command
   * @returns {Event[]}
   */
  handle (command) {
    if (!this.commandHandlerFunctions[command.name]) {
      this.logger.error(new Error(`Cannot handle incoming command ${command.name || 'no name given'}.`))
      return []
    }

    this.logger.debug(
      {
        name: command.name,
        time: command.time,
        payload: JSON.stringify(command.payload, null, 2),
        aggregateClass: this.constructor.name
      },
      'Going to handle a command.'
    )
    return this.commandHandlerFunctions[command.name](command)
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

module.exports = Entity
