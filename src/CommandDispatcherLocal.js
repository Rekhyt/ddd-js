const OutdatedEntityError = require('./GenericErrors/OutdatedEntityError')

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
   * @param {number} retries
   */
  subscribe (name, handler, retries = 5) {
    if (this._subscriptions[name]) {
      this._logger.error(
        new Error(`Handler subscribed to command "${name}" that already has a handler. Keeping former assignment.`)
      )
      return
    }

    this._subscriptions[name] = { handler, retries }
  }

  /**
   * @param {Command} command
   */
  async dispatch (command) {
    if (!this._subscriptions[command.name]) {
      throw new Error(`No handler for incoming command: ${command.name || 'no name given'}`)
    }

    let error = null
    let success = false
    let tries = 0

    do {
      if (tries > 0) await new Promise(resolve => setTimeout(resolve, 200))

      try {
        tries++
        const events = await this._subscriptions[command.name].handler.execute(command)
        success = true

        if (command.sagaId) events.forEach(e => (e.sagaId = command.sagaId))
        this._eventDispatcher.publishMany(events).catch(err => this._logger.error(err))
      } catch (err) {
        error = err
        if (!(err instanceof OutdatedEntityError)) throw err

        this._logger.error(command, `Affected entities outdated (command=${command.name}, tries=${tries})`)
      }
    } while (!success && tries <= this._subscriptions[command.name].retries)

    if (!success) throw error
  }
}

module.exports = CommandDispatcherLocal
