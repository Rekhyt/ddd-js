/**
 * @implements {EventDispatcher}
 */
class EventDispatcherLocal {
  /**
   * @param {Logger} logger
   * @param {EventRepository} repository
   */
  constructor (logger, repository) {
    this._logger = logger
    this._repository = repository
    this._subscriptions = {}
  }

  /**
   * @param {string} name
   * @param {EventHandler} handler
   */
  subscribe (name, handler) {
    if (!this._subscriptions[name]) this._subscriptions[name] = []

    this._subscriptions[name].push(handler)
  }

  /**
   * @param {Event} event
   * @param {boolean} save
   * @returns {Promise<void>}
   */
  async publish (event, save = true) {
    if (save) await this._repository.save(event)

    if (!this._subscriptions[event.name]) {
      this._logger.error(new Error(`No handlers for incoming event: ${event.name || 'no name given'}`))
      return
    }

    await Promise.all(this._subscriptions[event.name].map(async handler => handler.apply(event)))
  }

  /**
   * @param {Event[]} events
   * @param {boolean} save
   * @returns {Promise<void>}
   */
  async publishMany (events, save) {
    if (events) this._logger.debug({ events: JSON.stringify(events) }, 'Incoming events')
    await Promise.all(events.map(async event => this.publish(event, save)))
  }
}

module.exports = EventDispatcherLocal
