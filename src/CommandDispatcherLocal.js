/**
 * @implements CommandDispatcher
 */
class CommandDispatcherLocal {
  /**
   * @param {EventDispatcher} eventDispatcher
   * @param {Logger} logger
   */
  constructor (eventDispatcher, logger) {
    this._eventDispatcher = eventDispatcher
    this._logger = logger
    this._subscriptions = {}
  }

  /**
   * @param {string} name
   * @param {CommandHandler} handler
   */
  subscribe (name, handler) {
    if (this._subscriptions[name]) {
      this._logger.error(
        new Error(`Handler subscribed to command "${name}" that already has a handler. Keeping former assignment.`)
      )
      return
    }

    this._subscriptions[name] = handler
  }

  /**
   * @param {Command} command
   */
  async dispatch (command) {
    if (!this._subscriptions[command.name]) {
      this._logger.error(new Error(`No handler for incoming command: ${command.name || 'no name given'}`))
      return
    }

    await this._eventDispatcher.publishMany(this._subscriptions[command.name].handle(command))
  }
}

module.exports = CommandDispatcherLocal
