const uuid = require('uuid/v4')

/**
 * @implements {EventDispatcher}
 */
class EventDispatcherLocal {
  /**
   * @param {Logger} logger
   * @param {EventStore} repository
   */
  constructor (logger, repository) {
    this._logger = logger
    this._repository = repository
    this._subscriptions = {}
    this._locked = false
    this._lastEventUuid = null
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
    if (this._locked) {
      await new Promise(resolve => {
        const interval = setInterval(() => {
          if (this._locked) return this._logger.info('Event publishing locked, retrying in 1 second.')

          clearInterval(interval)
          resolve()
        }, 1000)
      })
    }

    if (!event.uuid) event.uuid = uuid()
    this._lastEventUuid = event.uuid

    if (save) await this._repository.save(event)

    if (!this._subscriptions[event.name]) {
      /* istanbul ignore next */
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
  async publishMany (events, save = true) {
    /* istanbul ignore else */
    if (events) this._logger.debug({ events: JSON.stringify(events) }, 'Incoming events')

    await Promise.all(events.map(async event => this.publish(event, save)))
  }

  /**
   * @returns {Promise<void>}
   */
  async replayAll () {
    // using synchronized for-each for the replay, because order must be the exact same as happened before
    for (const event of await this._repository.getAll()) {
      this._logger.info({
        eventName: event.name,
        eventTime: event.time
      }, 'Replaying event')
      await this.publish(event, false)
    }
  }

  lock () {
    this._locked = true
  }

  unlock () {
    this._locked = false
  }

  getLastProcessedEventUuid () {
    return this._lastEventUuid
  }
}

module.exports = EventDispatcherLocal
