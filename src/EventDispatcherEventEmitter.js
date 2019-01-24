const EventEmitter = require('events')

/**
 * @implements {EventDispatcher}
 */
class EventDispatcherEventEmitter extends EventEmitter {
  /**
   * @param {Logger} logger
   * @param {EventRepository} repository
   * @param {string} eventPrefix
   */
  constructor (logger, repository, eventPrefix = 'Rekhyt/ddd-base') {
    super()

    this._logger = logger
    this._repository = repository
    this._eventPrefix = eventPrefix
  }

  /**
   * @param {string} name
   * @param {EventHandler} handler
   */
  subscribe (name, handler) {
    this.on(`${this._eventPrefix}/event`, event => handler.apply(event))
  }

  /**
   * @param {Event} event
   * @returns {Promise<void>}
   */
  async publish (event) {
    await this._repository.save(event)

    if (!this.emit(`${this._eventPrefix}/event`, event)) {
      this._logger.error(new Error(`No handlers for incoming event: ${event.name || 'no name given'}`))
    }
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

module.exports = EventDispatcherEventEmitter
