/**
 * @implements CommandHandler
 * @implements EventHandler
 */
class Aggregate {
  /**
   * @param {Logger} logger
   */
  constructor (logger) {
    this.logger = logger
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
  }

  /**
   * @param {string} name
   * @param {Function} func
   */
  registerEvent (name, func) {
    if (this.eventHandlerFunctions[name]) {
      this.logger.error(
        new Error(`Two functions registered as event handler for ${name}. Keeping the former.`)
      )
      return
    }

    this.eventHandlerFunctions[name] = func
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

    return this.eventHandlerFunctions[event.name](event)
  }
}

module.exports = Aggregate
