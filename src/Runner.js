const express = require('express')
const bodyParser = require('body-parser')

const CommandDispatcherLocal = require('./CommandDispatcherLocal')
const EventDispatcherEventEmitter = require('./EventDispatcherEventEmitter')
const EventStoreJsonFile = require('./EventStoreJsonFile')

const InvalidArgumentError = require('./GenericErrors/InvalidArgumentError')
const InvalidTypeError = require('./GenericErrors/InvalidTypeError')
const ValidationError = require('./GenericErrors/ValidationError')
const SagaError = require('./GenericErrors/SagaError')

class Runner {
  /**
   * @param {CommandDispatcher} commandDispatcher
   * @param {EventDispatcher} eventDispatcher
   * @param {Logger} logger
   * @param {Express} server
   */
  constructor (commandDispatcher, eventDispatcher, logger, server) {
    this._commandDispatcher = commandDispatcher
    this._eventDispatcher = eventDispatcher
    this._logger = logger

    this._server = server

    this._rootEntities = []
    this._sagas = []
    this._readModels = []
    this._running = false
  }

  // istanbul ignore next
  /**
   * Builds a default runner on an express server.
   *
   * Using:
   * * CommandDispatcherLocal - using "in code" asynchronous command dispatching to registered classes
   * * EventDispatcherEventEmitter - using nodeJS events for event dispatching to registered classes
   * * EventStoreJsonFile - storing to the specified file path every 5 seconds
   * * express - an express server giving access to command bus and read models, running on APP_PORT or port 8000
   *
   * @param {Logger} logger
   * @param {string} eventStorePath Path to the JSON file in which events will be stored
   */
  static createWithExpress (logger, eventStorePath) {
    const eventDispatcher = new EventDispatcherEventEmitter(logger, new EventStoreJsonFile(eventStorePath))

    const server = express()
    server.use(bodyParser.json())

    return new Runner(new CommandDispatcherLocal(eventDispatcher, logger), eventDispatcher, logger, server)
  }

  /**
   * @return this
   */
  async replayHistory () {
    await this._eventDispatcher.replayAll()
    this._logger.info('All events replayed')

    return this
  }

  /**
   * Creates an instance of passed constructor and calls its setup() method.
   *
   * @param {typeof RootEntity} RootEntityConstructor
   *
   * @return this
   */
  attachRootEntity (RootEntityConstructor) {
    const rootEntity = new RootEntityConstructor(this._logger, this._commandDispatcher, this._eventDispatcher)
    rootEntity.setup()

    this._rootEntities.push(rootEntity)

    return this
  }

  /**
   * @param {typeof Saga} SagaConstructor
   *
   * @return this
   */
  attachSaga (SagaConstructor) {
    const saga = new SagaConstructor(this._logger, this._commandDispatcher)
    saga.setup()

    this._sagas.push(saga)

    return this
  }

  /**
   * @param {string} route The route under which the read model should be reachable
   * @param {typeof ReadModel} ReadModelConstructor The constructor of the read model class
   * @param {string} getter The getter or getter of the read model class that should be returned when the route was called
   *
   * @return this
   */
  attachReadModel (route, ReadModelConstructor, getter) {
    const instance = new ReadModelConstructor(this._logger, this._eventDispatcher)
    instance.setup()

    this._readModels.push({ route, instance, getter })

    if (this._running) this._setupReadModelRoute({ route, instance, getter })

    return this
  }

  startServer (port) {
    if (!port) port = process.env.APP_PORT || 8000

    this._server.post('/command', async (req, res) => {
      try {
        await this._commandDispatcher.dispatch(req.body)

        res.status(202).end()
      } catch (err) {
        let logSubject = err
        let status = 500
        let errorResponse = { message: err.message }

        if (err instanceof InvalidArgumentError || err instanceof InvalidTypeError) {
          logSubject = err.message
          status = 400
        }

        if (err instanceof ValidationError) {
          logSubject = { message: err.message, invalidFields: err.invalidFields }
          errorResponse.invalidFields = err.invalidFields
          status = 400
        }

        if (err instanceof SagaError) {
          const errors = err.errors.map(e => {
            const baseError = { entity: e.entityName, message: e.error.message }

            if (e.error instanceof ValidationError) {
              return { ...baseError, invalidFields: e.error.invalidFields }
            }

            return baseError
          })

          logSubject = { message: err.message, errors }
          errorResponse.validationErrors = errors

          // if all errors are 400 errors, make the status 400
          if (err.errors.every(e => (
            e.error instanceof InvalidArgumentError ||
            e.error instanceof InvalidTypeError ||
            e.error instanceof ValidationError
          ))) {
            status = 400
          }
        }

        this._logger.error(logSubject)
        res.status(status)
        res.json(errorResponse)
      }
    })

    for (const readModel of this._readModels) this._setupReadModelRoute(readModel)

    this._running = true
    this._server.listen(port)
    this._logger.info(`Listening on port ${port} . . .`)
  }

  _setupReadModelRoute (readModel) {
    this._server.get(readModel.route, async (req, res) => {
      res.json(await readModel.instance[readModel.getter])
    })
  }
}

module.exports = Runner
