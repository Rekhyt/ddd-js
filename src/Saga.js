const uuid = require('uuid/v4')
const SagaError = require('./GenericErrors/SagaError')

/**
 * @implements CommandHandler
 * @abstract
 */
class Saga {
  /**
   * @param {Logger} logger
   * @param {CommandDispatcher} commandDispatcher
   * @param {Function} [idGenerator]
   */
  constructor (logger, commandDispatcher, idGenerator = null) {
    this.logger = logger
    this._commandDispatcher = commandDispatcher
    this.idGenerator = idGenerator || uuid

    this._commandHandlerFunctions = {}
    this._runningSagas = {}
  }

  /**
   * @returns {object} with command names as keys and handler functions as values
   */
  get commandHandlerFunctions () {
    return this._commandHandlerFunctions
  }

  /**
   * @param {string} name
   * @param {Function} func
   */
  registerCommand (name, func) {
    if (this._commandHandlerFunctions[name]) {
      this.logger.error(
        new Error(`Two functions registered as command handler for ${name}. Keeping the former.`)
      )
      return
    }

    this._commandHandlerFunctions[name] = func
    this._commandDispatcher.subscribe(name, this)

    this.logger.info({
      commandName: name,
      entity: this.constructor.name,
      functionName: func.toString()
    }, 'Registered saga handler function for a command.')
  }

  /**
   * @param {Command} command
   * @returns {Event[]}
   */
  async execute (command) {
    if (!this._commandHandlerFunctions[command.name]) {
      /* istanbul ignore next */
      this.logger.error(new Error(`Cannot handle incoming command ${command.name || 'no name given'}.`))
      return []
    }

    this.logger.debug(
      {
        commandName: command.name,
        commandTime: command.time,
        commandPayload: JSON.stringify(command.payload, null, 2),
        entity: this.constructor.name
      },
      'Going to execute a saga-handled command.'
    )
    return this._commandHandlerFunctions[command.name](command)
  }

  /**
   * @param {Command} command
   * @returns {Promise<void>}
   */
  async _dispatch (command) {
    return this._commandDispatcher.dispatch(command)
  }

  /**
   * @param {string} name
   * @param {Object} payload
   * @returns {{payload: Object, name: string, time: string}|Event}
   */
  createEvent (name, payload = {}) {
    return {
      name,
      time: new Date().toISOString(),
      payload
    }
  }

  /**
   * @returns {string} The unique identifier of the started saga
   */
  provision () {
    const identifier = this.idGenerator()
    this._runningSagas[identifier] = { className: this.constructor.name, tasks: {} }
    this.logger.trace('Saga started', { class: this.constructor.name, identifier })

    return identifier
  }

  /**
   * @param {string} identifier
   * @param {Command} command
   * @param {string} entity
   * @param {Function} rollbackHandler
   * @param {number} timeout
   */
  addTask (identifier, command, entity, rollbackHandler, timeout = 1000) {
    if (!this._runningSagas[identifier]) throw new Error(`No saga found with given identifier ${identifier}.`)

    this._runningSagas[identifier].tasks[command.name] = { command, entity, rollbackHandler, timeout, status: 'added' }
    this.logger.trace('Task added to saga', { class: this.constructor.name, identifier, command, entity, timeout })
  }

  /**
   * @param {string} identifier
   * @returns {Promise<void>}
   * @throws {SagaError} if any of the commands fail or time out
   */
  async run (identifier) {
    if (!this._runningSagas[identifier]) throw new Error(`No saga found with given identifier ${identifier}.`)
    this.logger.trace('Running saga', { class: this.constructor.name, identifier })

    const tasks = Object.values(this._runningSagas[identifier].tasks)
    const sagaError = new SagaError()

    this.logger.trace('Executing tasks.', { class: this.constructor.name })
    await Promise.all(Object.entries(tasks).map(async ([commandName, task]) => {
      return new Promise(async resolve => {
        const timeout = setTimeout(
          () => {
            task.status = 'timed out'
            sagaError.addError(task.entity, new Error(`Command ${commandName} triggered by saga timed out.`))
            resolve()
          },
          task.timeout
        )

        try {
          this.logger.trace('Executing task.', { class: this.constructor.name, identifier, commandName, task })
          await this._dispatch(task.command)
          this.logger.trace('Task executed.', { class: this.constructor.name, identifier, commandName, task })
          task.status = 'done'
        } catch (err) {
          this.logger.trace('Task execution failed.', { class: this.constructor.name, identifier, commandName, task })
          task.status = 'failed'
          sagaError.addError(task.entity, err)
        }

        clearTimeout(timeout)
        resolve()
      })
    }))

    this.logger.trace('Tasks executed.', { class: this.constructor.name, identifier })
    delete this._runningSagas[identifier]

    if (!sagaError.hasErrors()) return

    const rollbackCommands = []
    for (const task of tasks) {
      this.logger.trace('Checking tasks for required rollback.', { class: this.constructor.name, identifier, task })
      if (task.status !== 'done' && task.status !== 'timed out') continue

      rollbackCommands.push(task.rollbackHandler())
    }

    try {
      this.logger.trace('Executing rollback tasks.', { class: this.constructor.name, identifier, rollbackCommands })
      await Promise.all(rollbackCommands.map(c => this._dispatch(c)))
    } catch  (err) {
      this.logger.fatal(err, 'At least one rollback command failed after at least one command of a saga failed!')
    }

    throw sagaError
  }
}

module.exports = Saga
