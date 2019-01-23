/**
 * @implements CommandHandler
 * @abstract
 */
class Entity {
  /**
   * @param {Logger} logger
   * @param {CommandDispatcher} commandDispatcher
   */
  constructor (logger, commandDispatcher) {
    this.logger = logger
    this._commandDispatcher = commandDispatcher
    this._commandHandlerFunctions = {}
  }

  /**
   * @param {string} name
   * @param {Function} func
   */
  registerCommand (name, func) {
    if (this._commandHandlerFunctions[name]) {
      this.logger.error(
        new Error(`Two functions registered as command handler for ${name}. Keeping the former.`)
      )
      return
    }

    this._commandHandlerFunctions[name] = func
    this._commandDispatcher.subscribe(name, this)

    this.logger.info({
      name,
      aggregateClass: this.constructor.name,
      functionName: func.name
    }, 'Registered handler function for a command.')
  }

  /**
   * @param {Command} command
   * @returns {Event[]}
   */
  handle (command) {
    if (!this._commandHandlerFunctions[command.name]) {
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
    return this._commandHandlerFunctions[command.name](command)
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
