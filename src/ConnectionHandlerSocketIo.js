class ConnectionHandlerSocketIo {
  /**
   * @param {CommandDispatcher} commandDispatcher
   * @param {EventDispatcher} eventDispatcher
   * @param {Server} io An object that behaves like socket.io's server class.
   * @param {Function} uuidGenerator A function that returns a unique ID as a string.
   * @param {Logger} logger
   * @param {string} socketEventPrefix
   */
  constructor (commandDispatcher, eventDispatcher, io, uuidGenerator, logger, socketEventPrefix = 'rekhyt/ddd-base') {
    this.commandDispatcher = commandDispatcher
    this.eventDispatcher = eventDispatcher
    this.io = io
    this.socketEventPrefix = socketEventPrefix.replace(/\/+$/, '') + '/'
    this.uuidGenerator = uuidGenerator
    this.logger = logger
    this.connections = {}

    this.io.on('connection', socket => this.onConnect(socket))
  }

  /**
   * @param {Socket} socket
   * @returns {Promise<void>}
   */
  async onConnect (socket) {
    const connectionId = `connection-${this.uuidGenerator()}`

    this.connections[connectionId] = socket

    socket.on('disconnect', () => this.onDisconnect(connectionId))
    socket.on(`${this.socketEventPrefix}Command`, async command => this.onCommand(connectionId, command))
    socket.on(`${this.socketEventPrefix}Event`, async event => this.onEvent(connectionId, event))
  }

  async onDisconnect (connectionId) {
    this.logger.info(`Client ${connectionId} disconnected.`)
    delete this.connections[connectionId]
  }

  /**
   * @param {string} connectionId
   * @param {Command} command
   * @returns {Promise<void>}
   */
  async onCommand (connectionId, command) {
    const commandId = `command-${this.uuidGenerator()}`
    this.logger.info(`Handling incoming command "${command.name}" from ${connectionId}.`, {
      commandId,
      type: 'command',
      name: command.name,
      time: command.time,
      payload: JSON.stringify(command.payload)
    })

    await this.commandDispatcher.dispatch(command)
  }

  /**
   * @param {string} connectionId
   * @param {Event} event
   * @returns {Promise<void>}
   */
  async onEvent (connectionId, event) {
    const eventId = `event-${this.uuidGenerator()}`
    this.logger.info(`Handling incoming event "${event.name}" from ${connectionId}`, {
      eventId,
      type: 'event',
      name: event.name,
      time: event.time,
      payload: JSON.stringify(event.payload)
    })

    await this.eventDispatcher.dispatch(event)
  }

  /**
   * @param {Event} event
   * @returns {Promise<void>}
   */
  async publish (event) {
    await this.eventDispatcher.publish(event)
  }

  /**
   * @param {Event[]} events
   * @returns {Promise<void>}
   */
  async publishMany (events) {
    await this.eventDispatcher.publishMany(events)
  }
}

module.exports = ConnectionHandlerSocketIo
