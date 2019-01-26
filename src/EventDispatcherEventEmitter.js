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
   * @param {boolean} save
   * @returns {Promise<void>}
   */
  async publish (event, save = true) {
    if (save) await this._repository.save(event)

    if (!this.emit(`${this._eventPrefix}/event`, event)) {
      this._logger.error(new Error(`No handlers for incoming event: ${event.name || 'no name given'}`))
    }
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

module.exports = EventDispatcherEventEmitter
