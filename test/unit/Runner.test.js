const sinon = require('sinon')
const proxyquire = require('proxyquire')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
chai.should()

const express = require('express')
const RootEntity = require('../../src/RootEntity')
const Saga = require('../../src/Saga')

const ReadModel = require('../../src/ReadModel')
const CommandDispatcherLocal = require('../../src/CommandDispatcherLocal')
const EventDispatcherEventEmitter = require('../../src/EventDispatcherEventEmitter')
const EventStoreJsonFile = require('../../src/EventStoreJsonFile')

const InvalidArgumentError = require('../../src/GenericErrors/InvalidArgumentError')
const InvalidTypeError = require('../../src/GenericErrors/InvalidTypeError')
const ValidationError = require('../../src/GenericErrors/ValidationError')
const SagaError = require('../../src/GenericErrors/SagaError')

const EventStoreJsonFileMock = { constructor: path => new EventStoreJsonFile(path) }
const Runner = proxyquire('../../src/Runner', {
  EventStoreJsonFile: EventStoreJsonFileMock
})

describe('Runner', () => {
  let subjectUnderTest
  let logger
  let commandDispatcher
  let eventDispatcher
  let server

  beforeEach(() => {
    logger = {
      trace: () => {},
      debug: () => {},
      info: () => {},
      warn: (...args) => console.log(args),
      error: (...args) => console.log(args)
    }

    commandDispatcher = {}
    eventDispatcher = {}
    server = {}

    subjectUnderTest = new Runner(commandDispatcher, eventDispatcher, logger, server)
  })

  describe('replayHistory', () => {
    it('should call the replayAll() method of the event dispatcher', async () => {
      eventDispatcher.replayAll = sinon.stub().resolves()

      await subjectUnderTest.replayHistory()

      sinon.assert.calledOnce(eventDispatcher.replayAll)
    })
  })

  describe('attachRootEntity', () => {
    it('should create a new instance of the given constructor and call setup', () => {
      const methodCalledBySetup = sinon.stub()
      const RootEntityImpl = class extends RootEntity { setup () { methodCalledBySetup() } }

      subjectUnderTest.attachRootEntity(RootEntityImpl)

      sinon.assert.calledOnce(methodCalledBySetup)
    })
  })

  describe('attachSaga', () => {
    it('should create a new instance of the given constructor and call setup', () => {
      const methodCalledBySetup = sinon.stub()
      const SagaImpl = class extends Saga { setup () { methodCalledBySetup() } }

      subjectUnderTest.attachSaga(SagaImpl)

      sinon.assert.calledOnce(methodCalledBySetup)
    })
  })
  describe('attachReadModel', () => {
    it('should create a new instance of the given constructor and call setup', () => {
      const methodCalledBySetup = sinon.stub()
      const ReadModelImpl = class extends ReadModel { setup () { methodCalledBySetup() } }

      subjectUnderTest.attachReadModel('/stuff', ReadModelImpl, 'stuff')

      sinon.assert.calledOnce(methodCalledBySetup)
    })

    it('should not set up a GET route for the read model if the server is not started', () => {
      server.get = sinon.stub()
      const ReadModelImpl = class extends ReadModel { setup () {} }

      subjectUnderTest.attachReadModel('/stuff', ReadModelImpl, 'stuff')

      sinon.assert.notCalled(server.get)
    })

    it('should set up a GET route for the read model if the server is started', () => {
      server.post = sinon.stub()
      server.listen = sinon.stub()
      server.get = sinon.stub()
      const ReadModelImpl = class extends ReadModel { setup () {} }

      subjectUnderTest.startServer()
      subjectUnderTest.attachReadModel('/stuff', ReadModelImpl, 'stuff')

      sinon.assert.calledOnce(server.get)
      sinon.assert.calledWith(server.get, '/stuff', sinon.match.func)
    })
  })

  describe('startServer', () => {
    it('should start a server on the given port', () => {
      server.post = sinon.stub()
      server.listen = sinon.stub()

      subjectUnderTest.startServer(1337)

      sinon.assert.calledOnce(server.listen)
      sinon.assert.calledWithExactly(server.listen, 1337)
    })

    it('should set up a POST route on /command', () => {
      server.post = sinon.stub()
      server.listen = sinon.stub()

      subjectUnderTest.startServer()

      sinon.assert.calledOnce(server.post)
      sinon.assert.calledWith(server.post, '/command', sinon.match.func)
    })

    it('should set up GET routes for all attached read models', () => {
      server.post = sinon.stub()
      server.get = sinon.stub()
      server.listen = sinon.stub()

      const ReadModelImpl = class extends ReadModel { setup () {} }

      subjectUnderTest.attachReadModel('/stuff', ReadModelImpl, 'stuff')
      subjectUnderTest.attachReadModel('/things', ReadModelImpl, 'things')
      subjectUnderTest.attachReadModel('/rubbish', ReadModelImpl, 'rubbish')

      subjectUnderTest.startServer()

      sinon.assert.calledThrice(server.get)
      sinon.assert.calledWith(server.get, '/stuff', sinon.match.func)
      sinon.assert.calledWith(server.get, '/things', sinon.match.func)
      sinon.assert.calledWith(server.get, '/rubbish', sinon.match.func)
    })
  })

  describe('this._server read model route handlers', () => {
    it('should return the JSON formatted given property of the read model', async () => {
      const functionCalledByReadModelGetter = sinon.stub().resolves('rm result')
      const ReadModelImpl = class extends ReadModel {
        setup () {}

        get stuff () {
          return functionCalledByReadModelGetter()
        }
      }

      const res = { json: sinon.stub() }

      let readModelHandler = false
      server.post = sinon.stub()
      server.listen = sinon.stub()
      server.get = async (route, handler) => { readModelHandler = handler }

      subjectUnderTest.attachReadModel('/stuff', ReadModelImpl, 'stuff')
      subjectUnderTest.startServer()

      readModelHandler.should.be.a('function')
      await readModelHandler(null, res)

      sinon.assert.calledOnce(functionCalledByReadModelGetter)
      sinon.assert.calledOnce(res.json)
      sinon.assert.calledWithExactly(res.json, 'rm result')
    })
  })

  describe('this._server command route handler', () => {
    it('should dispatch the command and return 202 on success', async () => {
      let commandHandler = false

      commandDispatcher.dispatch = sinon.stub().resolves()
      server.post = sinon.stub()
      server.listen = sinon.stub()
      server.post = async (route, handler) => { commandHandler = handler }

      const end = sinon.stub()
      const status = sinon.stub().returns({ end })
      const res = { status }

      subjectUnderTest.startServer()

      commandHandler.should.be.a('function')
      await commandHandler({ body: { command: 'lol' } }, res)

      sinon.assert.calledOnce(end)
      sinon.assert.calledOnce(status)
      sinon.assert.calledWith(status, 202)

      sinon.assert.calledOnce(commandDispatcher.dispatch)
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { command: 'lol' })
    })

    it('should dispatch the command and return any generic/unkown error with code 500', async () => {
      let commandHandler = false
      const error = new Error('broken!')

      logger.error = sinon.stub()
      commandDispatcher.dispatch = sinon.stub().rejects(error)
      server.post = sinon.stub()
      server.listen = sinon.stub()
      server.post = async (route, handler) => { commandHandler = handler }

      const end = sinon.stub()
      const status = sinon.stub().returns({ end })
      const json = sinon.stub()
      const res = { status, json }

      subjectUnderTest.startServer()

      commandHandler.should.be.a('function')
      await commandHandler({ body: { command: 'lol' } }, res)

      sinon.assert.notCalled(end)
      sinon.assert.calledOnce(commandDispatcher.dispatch)
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { command: 'lol' })

      sinon.assert.calledOnce(logger.error)
      sinon.assert.calledWithExactly(logger.error, error)

      sinon.assert.calledOnce(status)
      sinon.assert.calledWith(status, 500)

      sinon.assert.calledOnce(json)
      sinon.assert.calledWithExactly(json, { message: 'broken!' })
    })

    it('should dispatch and return invalid argument errors with code 400', async () => {
      let commandHandler = false
      const error = new InvalidArgumentError('broken!')

      logger.error = sinon.stub()
      commandDispatcher.dispatch = sinon.stub().rejects(error)
      server.post = sinon.stub()
      server.listen = sinon.stub()
      server.post = async (route, handler) => { commandHandler = handler }

      const end = sinon.stub()
      const status = sinon.stub().returns({ end })
      const json = sinon.stub()
      const res = { status, json }

      subjectUnderTest.startServer()

      commandHandler.should.be.a('function')
      await commandHandler({ body: { command: 'lol' } }, res)

      sinon.assert.notCalled(end)
      sinon.assert.calledOnce(commandDispatcher.dispatch)
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { command: 'lol' })

      sinon.assert.calledOnce(logger.error)
      sinon.assert.calledWithExactly(logger.error, error.message)

      sinon.assert.calledOnce(status)
      sinon.assert.calledWith(status, 400)

      sinon.assert.calledOnce(json)
      sinon.assert.calledWithExactly(json, { message: 'broken!' })
    })

    it('should dispatch and return invalid type errors with code 400', async () => {
      let commandHandler = false
      const error = new InvalidTypeError('number', 'string')

      logger.error = sinon.stub()
      commandDispatcher.dispatch = sinon.stub().rejects(error)
      server.post = sinon.stub()
      server.listen = sinon.stub()
      server.post = async (route, handler) => { commandHandler = handler }

      const end = sinon.stub()
      const status = sinon.stub().returns({ end })
      const json = sinon.stub()
      const res = { status, json }

      subjectUnderTest.startServer()

      commandHandler.should.be.a('function')
      await commandHandler({ body: { command: 'lol' } }, res)

      sinon.assert.notCalled(end)
      sinon.assert.calledOnce(commandDispatcher.dispatch)
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { command: 'lol' })

      sinon.assert.calledOnce(logger.error)
      sinon.assert.calledWithExactly(logger.error, error.message)

      sinon.assert.calledOnce(status)
      sinon.assert.calledWith(status, 400)

      sinon.assert.calledOnce(json)
      sinon.assert.calledWithExactly(json, { message: 'Value must be a "number", "string" passed instead.' })
    })

    it('should dispatch and return validation errors with code 400', async () => {
      let commandHandler = false
      const invalidFields = [
        { fieldName: 'emailAddress', message: 'Not a valid email address.' },
        { fieldName: 'preferredBeer', message: '"Radler" is not a valid value for enum "Beer".' }
      ]
      const error = new ValidationError(invalidFields)

      logger.error = sinon.stub()
      commandDispatcher.dispatch = sinon.stub().rejects(error)
      server.post = sinon.stub()
      server.listen = sinon.stub()
      server.post = async (route, handler) => { commandHandler = handler }

      const end = sinon.stub()
      const status = sinon.stub().returns({ end })
      const json = sinon.stub()
      const res = { status, json }

      subjectUnderTest.startServer()

      commandHandler.should.be.a('function')
      await commandHandler({ body: { command: 'lol' } }, res)

      sinon.assert.notCalled(end)
      sinon.assert.calledOnce(commandDispatcher.dispatch)
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { command: 'lol' })

      sinon.assert.calledOnce(logger.error)
      sinon.assert.calledWithExactly(logger.error, {
        invalidFields,
        message: 'The following fields were invalid: emailAddress, preferredBeer'
      })

      sinon.assert.calledOnce(status)
      sinon.assert.calledWith(status, 400)

      sinon.assert.calledOnce(json)
      sinon.assert.calledWithExactly(json, {
        invalidFields,
        message: 'The following fields were invalid: emailAddress, preferredBeer'
      })
    })

    it('should dispatch and return saga errors with code 400 if all sub-errors are client errors', async () => {
      let commandHandler = false
      const invalidFields = [
        { fieldName: 'emailAddress', message: 'Not a valid email address.' },
        { fieldName: 'preferredBeer', message: '"Radler" is not a valid value for enum "Beer".' }
      ]

      const expectedErrors = [
        {
          entity: 'Player',
          message: 'Number must be greater than 0.'
        },
        {
          entity: 'Player',
          message: 'Value must be a "number", "boolean" passed instead.'
        },
        {
          entity: 'Player',
          message: 'The following fields were invalid: emailAddress, preferredBeer',
          invalidFields
        }
      ]

      const argumentError = new InvalidArgumentError('Number must be greater than 0.')
      const typeError = new InvalidTypeError('number', 'boolean')
      const validationError = new ValidationError(invalidFields)

      const sagaError = new SagaError()
      sagaError.addError('Player', argumentError)
      sagaError.addError('Player', typeError)
      sagaError.addError('Player', validationError)

      logger.error = sinon.stub()
      commandDispatcher.dispatch = sinon.stub().rejects(sagaError)
      server.post = sinon.stub()
      server.listen = sinon.stub()
      server.post = async (route, handler) => { commandHandler = handler }

      const end = sinon.stub()
      const status = sinon.stub().returns({ end })
      const json = sinon.stub()
      const res = { status, json }

      subjectUnderTest.startServer()

      commandHandler.should.be.a('function')
      await commandHandler({ body: { command: 'lol' } }, res)

      sinon.assert.notCalled(end)
      sinon.assert.calledOnce(commandDispatcher.dispatch)
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { command: 'lol' })

      sinon.assert.calledOnce(logger.error)
      sinon.assert.calledWithExactly(logger.error, {
        errors: expectedErrors,
        message: 'Errors on entity Player'
      })

      sinon.assert.calledOnce(status)
      sinon.assert.calledWith(status, 400)

      sinon.assert.calledOnce(json)
      sinon.assert.calledWithExactly(json, {
        message: 'Errors on entity Player',
        sagaErrors: expectedErrors
      })
    })

    it('should dispatch and return saga errors with code 500 if at least one sub-errors is not a client error', async () => {
      let commandHandler = false

      const expectedErrors = [
        {
          entity: 'Player',
          message: 'Number must be greater than 0.'
        },
        {
          entity: 'Player',
          message: 'Value must be a "number", "boolean" passed instead.'
        },
        {
          entity: 'Player',
          message: 'some error'
        }
      ]

      const argumentError = new InvalidArgumentError('Number must be greater than 0.')
      const typeError = new InvalidTypeError('number', 'boolean')
      const someError = new Error('some error')

      const sagaError = new SagaError()
      sagaError.addError('Player', argumentError)
      sagaError.addError('Player', typeError)
      sagaError.addError('Player', someError)

      logger.error = sinon.stub()
      commandDispatcher.dispatch = sinon.stub().rejects(sagaError)
      server.post = sinon.stub()
      server.listen = sinon.stub()
      server.post = async (route, handler) => { commandHandler = handler }

      const end = sinon.stub()
      const status = sinon.stub().returns({ end })
      const json = sinon.stub()
      const res = { status, json }

      subjectUnderTest.startServer()

      commandHandler.should.be.a('function')
      await commandHandler({ body: { command: 'lol' } }, res)

      sinon.assert.notCalled(end)
      sinon.assert.calledOnce(commandDispatcher.dispatch)
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { command: 'lol' })

      sinon.assert.calledOnce(logger.error)
      sinon.assert.calledWithExactly(logger.error, {
        errors: expectedErrors,
        message: 'Errors on entity Player'
      })

      sinon.assert.calledOnce(status)
      sinon.assert.calledWith(status, 500)

      sinon.assert.calledOnce(json)
      sinon.assert.calledWithExactly(json, {
        message: 'Errors on entity Player',
        sagaErrors: expectedErrors
      })
    })
  })
})
