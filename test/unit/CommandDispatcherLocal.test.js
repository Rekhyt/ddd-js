const sinon = require('sinon')
const chai = require('chai')

chai.use(require('chai-as-promised'))
chai.should()

const CommandDispatcherLocal = require('../../src/CommandDispatcherLocal')
const OutdatedEntityError = require('../../src/GenericErrors/OutdatedEntityError')
const IntegerVersion = require('../../src/ValueObject/IntegerVersion')

describe('CommandDispatcherLocal', () => {
  let subjectUnderTest
  let eventDispatcher
  let logger

  beforeEach(() => {
    eventDispatcher = {
      publish: async event => {},
      publishMany: async events => {},
      dispatch: async event => {}
    }

    logger = {
      trace: () => {},
      debug: () => {},
      info: () => {},
      warn: (...args) => console.log(args),
      error: (...args) => console.log(args)
    }

    subjectUnderTest = new CommandDispatcherLocal(eventDispatcher, logger)
  })

  describe('subscribe', () => {
    it('should log an error if two handlers are assigned to a command', () => {
      logger.error = sinon.stub()

      subjectUnderTest.subscribe('command1', {})
      subjectUnderTest.subscribe('command1', {})

      sinon.assert.calledOnce(logger.error)
    })
  })

  describe('dispatch', () => {
    it('should dispatch a given command to its subscribed handler', async () => {
      const handler = {
        execute: sinon.stub().resolves([]),
        getAffectedEntities: sinon.stub().resolves([])
      }

      subjectUnderTest.subscribe('command', handler)
      await subjectUnderTest.dispatch({ name: 'command' })

      sinon.assert.calledOnce(handler.execute)
      sinon.assert.calledWithExactly(handler.execute, { name: 'command' })
    })

    it('should publish events resulting from a command', async () => {
      const handler = {
        execute: sinon.stub().resolves([{ eventNo: 1 }, { eventNo: 2 }]),
        getAffectedEntities: sinon.stub().resolves([])
      }
      eventDispatcher.publishMany = sinon.stub().resolves()

      subjectUnderTest.subscribe('command', handler)
      await subjectUnderTest.dispatch({ name: 'command' })

      sinon.assert.calledOnce(handler.execute)
      sinon.assert.calledWithExactly(handler.execute, { name: 'command' })

      sinon.assert.calledOnce(eventDispatcher.publishMany)
      sinon.assert.calledWithExactly(eventDispatcher.publishMany, [{ eventNo: 1 }, { eventNo: 2 }])
    })

    it('should pass on a saga ID from a command to the events', async () => {
      const handler = {
        execute: sinon.stub().resolves([{ eventNo: 1 }, { eventNo: 2 }]),
        getAffectedEntities: sinon.stub().resolves([])
      }
      eventDispatcher.publishMany = sinon.stub().resolves()

      subjectUnderTest.subscribe('command', handler)
      await subjectUnderTest.dispatch({ name: 'command', sagaId: '1337' })

      sinon.assert.calledOnce(handler.execute)
      sinon.assert.calledWithExactly(handler.execute, { name: 'command', sagaId: '1337' })

      sinon.assert.calledOnce(eventDispatcher.publishMany)
      sinon.assert.calledWithExactly(eventDispatcher.publishMany, [
        { eventNo: 1, sagaId: '1337' }, { eventNo: 2, sagaId: '1337' }
      ])
    })

    it('should dispatch to the former handler and log an error if two are subscribed', async () => {
      logger.error = sinon.stub() /* do not log to console, it's expected */
      const handler1 = {
        execute: sinon.stub().resolves([]),
        getAffectedEntities: sinon.stub().resolves([])
      }
      const handler2 = {
        execute: sinon.stub().resolves([]),
        getAffectedEntities: sinon.stub().resolves([])
      }

      subjectUnderTest.subscribe('command', handler1)
      subjectUnderTest.subscribe('command', handler2)

      await subjectUnderTest.dispatch({ name: 'command' })

      sinon.assert.calledOnce(logger.error)

      sinon.assert.calledOnce(handler1.execute)
      sinon.assert.calledWithExactly(handler1.execute, { name: 'command' })

      sinon.assert.notCalled(handler2.execute)
    })

    it('should throw an error if command execution fails', async () => {
      const expectedError = new Error('Nah.')
      const handler = {
        execute: sinon.stub().rejects(expectedError),
        getAffectedEntities: sinon.stub().resolves([])
      }

      logger.error = sinon.stub()
      eventDispatcher.publishMany = sinon.stub()

      subjectUnderTest.subscribe('command', handler)

      await subjectUnderTest.dispatch({ name: 'command' }).should.eventually.be.rejectedWith(expectedError)

      sinon.assert.notCalled(logger.error)
      sinon.assert.notCalled(eventDispatcher.publishMany)

      sinon.assert.calledOnce(handler.execute)
      sinon.assert.calledWithExactly(handler.execute, { name: 'command' })
    })

    it('should throw an error if no handler is subscribed for an incoming command', async () => {
      logger.error = sinon.stub()
      eventDispatcher.publishMany = sinon.stub()

      await subjectUnderTest.dispatch({ name: 'command' }).should.eventually.be.rejectedWith('No handler for incoming command: command')

      sinon.assert.notCalled(eventDispatcher.publishMany)
    })

    it('should throw an error if no handler is subscribed for an incoming command without a name', async () => {
      logger.error = sinon.stub()
      eventDispatcher.publishMany = sinon.stub()

      await subjectUnderTest.dispatch({ noName: 'command' }).should.eventually.be.rejectedWith('No handler for incoming command: no name given')

      sinon.assert.notCalled(eventDispatcher.publishMany)
    })

    it('should log an error if the publishing the resulting events fails', async () => {
      const expectedError = new Error('Error punlishing events.')
      const handler = {
        execute: sinon.stub().resolves([{ eventName: 'event1' }]),
        getAffectedEntities: sinon.stub().resolves([])
      }

      logger.error = sinon.stub()
      eventDispatcher.publishMany = sinon.stub().rejects(expectedError)

      subjectUnderTest.subscribe('command', handler)
      await subjectUnderTest.dispatch({ name: 'command' })

      sinon.assert.calledOnce(handler.execute)
      sinon.assert.calledOnce(eventDispatcher.publishMany)
      sinon.assert.calledOnce(logger.error)
      sinon.assert.calledWithExactly(logger.error, expectedError)
    })

    it('should log an error and retry if the entity has changed during command processing', async () => {
      const Entity = class {
        constructor () { this.version = new IntegerVersion(1) }
        versionUp () { this.version = this.version.getNextVersion() }
      }
      const entity = new Entity()

      logger.error = sinon.stub()
      eventDispatcher.publishMany = sinon.stub().resolves()
      const handler = {
        getAffectedEntities: sinon.stub().resolves([entity]),
        execute: sinon.stub()
          .onFirstCall().callsFake(() => entity.versionUp()).resolves([{ eventName: 'event1' }])
          .onSecondCall().resolves([{ eventName: 'event1' }])
      }

      subjectUnderTest.subscribe('command', handler)
      await subjectUnderTest.dispatch({ name: 'command' })

      sinon.assert.calledTwice(handler.execute)
      sinon.assert.calledOnce(eventDispatcher.publishMany)
      sinon.assert.calledOnce(logger.error)
      sinon.assert.calledWithExactly(logger.error,
        { command: { name: 'command' }, entities: ['Entity'], tries: 1 },
        'Affected entities outdated'
      )
    })

    it('should retry 5 times, then give up if the entity has changed during command processing', async () => {
      const Entity = class {
        constructor () { this.version = new IntegerVersion(1) }
        versionUp () { this.version = this.version.getNextVersion() }
      }
      const entity = new Entity()

      const expectedErrorMessage = 'Affected entities outdated'
      logger.error = sinon.stub()
      eventDispatcher.publishMany = sinon.stub().resolves()
      const handler = {
        getAffectedEntities: sinon.stub().resolves([entity]),
        execute: sinon.stub()
          .onCall(0).callsFake(() => entity.versionUp()).resolves()
          .onCall(1).callsFake(() => entity.versionUp()).resolves()
          .onCall(2).callsFake(() => entity.versionUp()).resolves()
          .onCall(3).callsFake(() => entity.versionUp()).resolves()
          .onCall(4).callsFake(() => entity.versionUp()).resolves()
          .onCall(5).callsFake(() => entity.versionUp()).resolves()
      }

      subjectUnderTest.subscribe('command', handler, 5)
      await subjectUnderTest.dispatch({ name: 'command' })
        .should.eventually.be.rejectedWith(OutdatedEntityError, 'Affected entities changed during processing: Entity')

      sinon.assert.callCount(handler.execute, 6)
      sinon.assert.notCalled(eventDispatcher.publishMany)

      sinon.assert.callCount(logger.error, 6)
      sinon.assert.calledWithExactly(logger.error, { command: { name: 'command' }, entities: ['Entity'], tries: 1 }, expectedErrorMessage)
      sinon.assert.calledWithExactly(logger.error, { command: { name: 'command' }, entities: ['Entity'], tries: 2 }, expectedErrorMessage)
      sinon.assert.calledWithExactly(logger.error, { command: { name: 'command' }, entities: ['Entity'], tries: 3 }, expectedErrorMessage)
      sinon.assert.calledWithExactly(logger.error, { command: { name: 'command' }, entities: ['Entity'], tries: 4 }, expectedErrorMessage)
      sinon.assert.calledWithExactly(logger.error, { command: { name: 'command' }, entities: ['Entity'], tries: 5 }, expectedErrorMessage)
      sinon.assert.calledWithExactly(logger.error, { command: { name: 'command' }, entities: ['Entity'], tries: 6 }, expectedErrorMessage)
    })
  })
})
