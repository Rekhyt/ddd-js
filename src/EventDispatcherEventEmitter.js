const EventEmitter = require('events')

/**
 * @implements {EventDispatcher}
 */
class EventDispatcherEventEmitter extends EventEmitter {
  /**
   * @param {Logger} logger
   * @param {string} eventPrefix
   */
  constructor (logger, eventPrefix = 'Rekhyt/ddd-base') {
    super()

    this._logger = logger
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
    // the local dispatcher just forwards internally
    this.emit(`${this._eventPrefix}/event`, event)
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
