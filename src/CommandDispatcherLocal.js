/**
 * @implements CommandDispatcher
 */
class CommandDispatcherLocal {
  /**
   * @param {EventDispatcher} eventDispatcher
   * @param {Logger} logger
   */
  constructor (eventDispatcher, logger) {
    this.eventDispatcher = eventDispatcher
    this.logger = logger
    this.subscriptions = {}
  }

  /**
   * @param {string} name
   * @param {CommandHandler} handler
   */
  subscribe (name, handler) {
    if (this.subscriptions[name]) {
      this.logger.error(
        new Error(`Handler subscribed to command "${name}" that already has a handler. Keeping former assignment.`)
      )
      return
    }

    this.subscriptions[name] = handler
  }

  /**
   * @param {Command} command
   */
  async dispatch (command) {
    if (!this.subscriptions[command.name]) {
      this.logger.error(new Error(`No handler for incoming command: ${command.name || 'no name given'}`))
      return
    }

    await this.eventDispatcher.publishMany(this.subscriptions[command.name].handle(command))
  }
}

module.exports = CommandDispatcherLocal
