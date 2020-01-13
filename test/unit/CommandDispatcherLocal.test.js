const sinon = require('sinon')
const chai = require('chai')

chai.use(require('chai-as-promised'))
chai.should()

const CommandDispatcherLocal = require('../../src/CommandDispatcherLocal')

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
      const handler = { execute: sinon.stub().resolves([]) }

      subjectUnderTest.subscribe('command', handler)
      await subjectUnderTest.dispatch({ name: 'command' })

      sinon.assert.calledOnce(handler.execute)
      sinon.assert.calledWithExactly(handler.execute, { name: 'command' })
    })

    it('should publish events resulting from a command', async () => {
      const handler = { execute: sinon.stub().resolves([{ eventNo: 1 }, { eventNo: 2 }]) }
      eventDispatcher.publishMany = sinon.stub().resolves()

      subjectUnderTest.subscribe('command', handler)
      await subjectUnderTest.dispatch({ name: 'command' })

      sinon.assert.calledOnce(handler.execute)
      sinon.assert.calledWithExactly(handler.execute, { name: 'command' })

      sinon.assert.calledOnce(eventDispatcher.publishMany)
      sinon.assert.calledWithExactly(eventDispatcher.publishMany, [{ eventNo: 1 }, { eventNo: 2 }])
    })

    it('should dispatch to the former handler and log an error if two are subscribed', async () => {
      logger.error = sinon.stub() /* do not log to console, it's expected */
      const handler1 = { execute: sinon.stub().resolves([]) }
      const handler2 = { execute: sinon.stub().resolves([]) }

      subjectUnderTest.subscribe('command', handler1)
      subjectUnderTest.subscribe('command', handler2)

      await subjectUnderTest.dispatch({ name: 'command' })

      sinon.assert.calledOnce(logger.error)

      sinon.assert.calledOnce(handler1.execute)
      sinon.assert.calledWithExactly(handler1.execute, { name: 'command' })

      sinon.assert.notCalled(handler2.execute)
    })

    it('should throw an error if no handler is subscribed for an incoming command', async () => {
      logger.error = sinon.stub()
      eventDispatcher.publishMany = sinon.stub()

      await subjectUnderTest.dispatch({ name: 'command' }).should.eventually.be.rejectedWith('No handler for incoming command: command')

      sinon.assert.notCalled(eventDispatcher.publishMany)
    })

    it('should log an error if the publishing the resulting events fails', async () => {
      const expectedError = new Error('Error punlishing events.')
      logger.error = sinon.stub()
      eventDispatcher.publishMany = sinon.stub().rejects(expectedError)
      const handler = { execute: sinon.stub().resolves([{ eventName: 'event1' }]) }

      subjectUnderTest.subscribe('command', handler)
      await subjectUnderTest.dispatch({ name: 'command' })

      sinon.assert.calledOnce(handler.execute)
      sinon.assert.calledOnce(eventDispatcher.publishMany)
      sinon.assert.calledOnce(logger.error)
      sinon.assert.calledWithExactly(logger.error, expectedError)
    })
  })
})
