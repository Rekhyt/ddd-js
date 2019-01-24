/**
 * @implements {EventDispatcher}
 */
class EventDispatcherLocal {
  /**
   * @param {Logger} logger
   */
  constructor (logger) {
    this._logger = logger
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
   * @returns {Promise<void>}
   */
  async publish (event) {
    if (!this._subscriptions[event.name]) {
      this._logger.error(new Error(`No handlers for incoming event: ${event.name || 'no name given'}`))
      return
    }

    await Promise.all(this._subscriptions[event.name].map(async handler => handler.apply(event)))
  }

  /**
   * @param {Event[]} events
   * @returns {Promise<void>}
   */
  async publishMany (events) {
    if (events) this._logger.debug('Incoming events', events)
    await Promise.all(events.map(async event => this.publish(event)))
  }
}

module.exports = EventDispatcherLocal
