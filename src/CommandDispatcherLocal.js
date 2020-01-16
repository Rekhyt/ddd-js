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

    const commandHandler = this._subscriptions[command.name].handler
    const affectedEntities = await commandHandler.getAffectedEntities(command)

    let success = false
    let tries = 0
    let outdatedAffectedEntities = []

    do {
      if (tries > 0) await new Promise(resolve => setTimeout(resolve, 200))

      // store the current versions of the affected entities
      const versionsByEntities = affectedEntities.reduce((a, e) => {
        a[e.constructor.name] = e.version
        return a
      }, {})

      // count up the tries and execute the command
      tries++
      const events = await commandHandler.execute(command)

      // transfer saga ID from command to events for log tracing
      if (command.sagaId) events.forEach(e => (e.sagaId = command.sagaId))

      // collect affected entities that meanwhile have changed
      outdatedAffectedEntities = affectedEntities.filter(e => !versionsByEntities[e.constructor.name].equals(e.version))

      // if none changed, increment entity versions, emit resulting events and exit the loop
      if (outdatedAffectedEntities.length === 0) {
        affectedEntities.forEach(e => e.versionUp())
        this._eventDispatcher.publishMany(events).catch(err => this._logger.error(err))
        success = true
        break
      }

      // log affected entities that are outdated, start over
      this._logger.error(
        { command, tries, entities: affectedEntities.map(e => e.constructor.name) },
        `Affected entities outdated`
      )
    } while (tries <= this._subscriptions[command.name].retries)

    if (!success) throw new OutdatedEntityError(outdatedAffectedEntities)
  }
}

module.exports = CommandDispatcherLocal
