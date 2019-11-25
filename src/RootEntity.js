/**
 * @implements CommandHandler
 * @implements EventHandler
 * @abstract
 */
class RootEntity {
  /**
   * @param {Logger} logger
   * @param {CommandDispatcher} commandDispatcher
   * @param {EventDispatcher} eventDispatcher
   */
  constructor (logger, commandDispatcher, eventDispatcher) {
    this.logger = logger
    this._commandDispatcher = commandDispatcher
    this._commandHandlerFunctions = {}
    this._eventDispatcher = eventDispatcher
    this._eventHandlerFunctions = {}
  }

  /**
   * @returns {object} with event names as keys and handler functions as values
   */
  get eventHandlerFunctions () {
    return this._eventHandlerFunctions
  }

  /**
   * @returns {object} with event names as keys and handler functions as values
   */
  get commandHandlerFunctions () {
    return this._commandHandlerFunctions
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
      commandName: name,
      entity: this.constructor.name,
      functionName: func.toString()
    }, 'Registered entity handler function for a command.')
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
      entity: this.constructor.name,
      functionName: func.toString()
    }, 'Registered handler function for an event.')
  }

  /**
   * @param {Command} command
   * @returns {Event[]}
   */
  async execute (command) {
    if (!this._commandHandlerFunctions[command.name]) {
      /* istanbul ignore next */
      this.logger.error(new Error(`Cannot handle incoming command ${command.name || 'no name given'}.`))
      return []
    }

    this.logger.debug(
      {
        commandName: command.name,
        commandTime: command.time,
        commandPayload: JSON.stringify(command.payload, null, 2),
        entity: this.constructor.name
      },
      'Going to execute a entity-handled command.'
    )
    return this._commandHandlerFunctions[command.name](command)
  }

  /**
   * @param {Event} event
   * @returns {Promise<Event[]>}
   */
  async apply (event) {
    if (!this._eventHandlerFunctions[event.name]) {
      /* istanbul ignore next */
      this.logger.error(new Error(`Cannot apply incoming event ${event.name || 'no name given'}.`))
      return []
    }

    this.logger.debug(
      {
        eventName: event.name,
        eventTime: event.time,
        eventPayload: JSON.stringify(event.payload, null, 2),
        entity: this.constructor.prototype
      },
      'Going to apply an event.'
    )
    return this._eventHandlerFunctions[event.name](event)
  }

  /**
   * @param {string} name
   * @param {Object} payload
   * @returns {{payload: Object, name: string, time: string}|Event}
   */
  createEvent (name, payload = {}) {
    return {
      name,
      time: new Date().toISOString(),
      payload
    }
  }
}

module.exports = RootEntity
