/**
 * @implements {EventDispatcher}
 */
class EventDispatcherLocal {
  /**
   * @param {Logger} logger
   */
  constructor (logger) {
    this.logger = logger
    this.subscriptions = {}
  }

  /**
   * @param {string} name
   * @param {EventHandler} handler
   */
  subscribe (name, handler) {
    if (!this.subscriptions[name]) this.subscriptions[name] = []

    this.subscriptions[name].push(handler)
  }

  /**
   * @param {Event} event
   * @returns {Promise<void>}
   */
  async publish (event) {
    // the local dispatcher just forwards internally
    await this.dispatch(event)
  }

  /**
   * @param {Event[]} events
   * @returns {Promise<void>}
   */
  async publishMany (events) {
    if (events) this.logger.debug('Incoming events', events)
    await Promise.all(events.map(async event => this.publish(event)))
  }

  /**
   * @param {Event} event
   * @return {Promise<void>}
   */
  async dispatch (event) {
    if (!this.subscriptions[event.name]) {
      this.logger.error(new Error(`No handlers for incoming event: ${event.name || 'no name given'}`))
      return
    }

    await Promise.all(
      (await Promise.all(this.subscriptions[event.name].map(async handler => handler.apply(event))))
        .map(async resultingEvents => this.publishMany(resultingEvents))
    )
  }
}

module.exports = EventDispatcherLocal
