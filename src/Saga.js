/**
 * @implements CommandHandler
 * @abstract
 */
class Saga {
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
    }, 'Registered saga handler function for a command.')
  }

  /**
   * @param {Command} command
   * @returns {Event[]}
   */
  execute (command) {
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
      'Going to execute a saga-handled command.'
    )
    return this._commandHandlerFunctions[command.name](command)
  }
}

module.exports = Saga
