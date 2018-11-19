/**
 * @implements CommandDispatcher
 */
class CommandDispatcherLocal {
  /**
   * @param {Logger} logger
   */
  constructor (logger) {
    this.logger = logger
    this.subscriptions = {}
  }

  /**
   * @param {string} name
   * @param {CommandHandler} handler
   */
  subscribe (name, handler) {
    if (this.subscriptions[name]) {
      this.logger.warn(`Handler subscribed to command "${name}" that already has a handler. Keeping former assignment.`)
      return
    }

    this.subscriptions[name] = handler
  }

  /**
   * @param {Command} command
   */
  dispatch (command) {
    if (!this.subscriptions[command.name]) {
      this.logger.warn(`No handler for incoming command: ${command.name || 'no name given'}`, command)
      return
    }

    return this.subscriptions[command.name].handle(command)
  }
}

module.exports = CommandDispatcherLocal
