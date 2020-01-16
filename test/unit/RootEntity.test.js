const sinon = require('sinon')
const assert = require('assert')
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()

const RootEntity = require('../../src/RootEntity')

const Impl = class extends RootEntity {
  setup () {}
}

describe('RootEntity', () => {
  let subjectUnderTest
  let logger
  let commandDispatcher
  let eventDispatcher

  beforeEach(() => {
    logger = {
      trace: () => {},
      debug: () => {},
      info: () => {},
      warn: (...args) => console.log(args),
      error: (...args) => console.log(args)
    }

    eventDispatcher = {
      subscribe: () => {}
    }

    commandDispatcher = {
      subscribe: () => {}
    }

    subjectUnderTest = new Impl(logger, commandDispatcher, eventDispatcher)
  })

  describe('registerCommand', () => {
    it('should subscribe itself as handler for a given command', () => {
      const expectedName = 'command1'
      let callCounter = 0

      commandDispatcher.subscribe = (name, func) => {
        assert.strictEqual(name, expectedName)
        assert.strictEqual(func, subjectUnderTest)
        callCounter++
      }

      subjectUnderTest.registerCommand(expectedName, () => {})

      assert.strictEqual(callCounter, 1)
    })

    it('should log an error and do nothing when assigned twice or more for the same command', () => {
      const expectedName = 'command1'
      let subscribeCallCounter = 0
      let errorLogCallCounter = 0

      logger.error = () => errorLogCallCounter++

      commandDispatcher.subscribe = (name, func) => {
        assert.strictEqual(name, expectedName)
        assert.strictEqual(func, subjectUnderTest)
        subscribeCallCounter++
      }

      subjectUnderTest.registerCommand(expectedName, () => {})
      subjectUnderTest.registerCommand(expectedName, () => {})

      assert.strictEqual(errorLogCallCounter, 1)
      assert.strictEqual(subscribeCallCounter, 1)
    })
  })

  describe('get commandHandlerFunctions', () => {
    it('should return all command handlers by command names that were previously registered', () => {
      const expectedCommands = {
        command1: () => {},
        command2: () => {},
        command3: () => {}
      }

      for (let commandName in expectedCommands) {
        subjectUnderTest.registerCommand(commandName, expectedCommands[commandName])
      }

      assert.deepStrictEqual(subjectUnderTest.commandHandlerFunctions, expectedCommands)
    })
  })

  describe('getAffectedEntities', () => {
    it('should register a handler that returns an empty array if none was passed', async () => {
      subjectUnderTest.registerCommand('command1', () => {})
      await subjectUnderTest.getAffectedEntities({ name: 'command1' }).should.eventually.deep.equal([])
    })

    it('should call the registered handler function and return its result', async () => {
      const affectedEntityHandler = sinon.stub().resolves('some result')
      subjectUnderTest.registerCommand('command1', () => {}, affectedEntityHandler)

      await subjectUnderTest.getAffectedEntities({ name: 'command1' }).should.eventually.equal('some result')
      sinon.assert.calledOnce(affectedEntityHandler)
    })
  })

  describe('execute', () => {
    it('should call the command handler for a registered command when incoming', async () => {
      const expectedCommand = { name: 'command1' }
      let handlerCallCount = 0

      subjectUnderTest.registerCommand('command1', command => {
        assert.deepStrictEqual(command, expectedCommand)
        handlerCallCount++
      })

      await subjectUnderTest.execute(expectedCommand)

      assert.strictEqual(handlerCallCount, 1)
    })

    it('should log an error and do nothing when called for a command that is unknown/unregistered', async () => {
      let loggerCallCount = 0
      let handlerCallCount = 0

      logger.error = () => loggerCallCount++

      subjectUnderTest.registerCommand('command1', () => handlerCallCount)
      subjectUnderTest.registerCommand('command2', () => handlerCallCount)
      subjectUnderTest.registerCommand('command3', () => handlerCallCount)

      await subjectUnderTest.execute({ name: 'unknownCommand' })

      assert.strictEqual(loggerCallCount, 1)
      assert.strictEqual(handlerCallCount, 0)
    })
  })

  describe('registerEvent', () => {
    it('should subscribe itself as handler for a given event', () => {
      const expectedName = 'event1'
      let callCounter = 0

      eventDispatcher.subscribe = (name, func) => {
        assert.strictEqual(name, expectedName)
        assert.strictEqual(func, subjectUnderTest)
        callCounter++
      }

      subjectUnderTest.registerEvent(expectedName, () => {})

      assert.strictEqual(callCounter, 1)
    })

    it('should log an error and do nothing when assigned twice or more for the same event', () => {
      const expectedName = 'event1'
      let subscribeCallCounter = 0
      let errorLogCallCounter = 0

      logger.error = () => errorLogCallCounter++

      eventDispatcher.subscribe = (name, func) => {
        assert.strictEqual(name, expectedName)
        assert.strictEqual(func, subjectUnderTest)
        subscribeCallCounter++
      }

      subjectUnderTest.registerEvent(expectedName, () => {})
      subjectUnderTest.registerEvent(expectedName, () => {})

      assert.strictEqual(errorLogCallCounter, 1)
      assert.strictEqual(subscribeCallCounter, 1)
    })
  })

  describe('get eventHandlerFunctions', () => {
    it('should return all event names that were previously registered', () => {
      const expectedEvents = {
        event1: () => {},
        event2: () => {},
        event3: () => {}
      }

      for (let eventName in expectedEvents) {
        subjectUnderTest.registerEvent(eventName, expectedEvents[eventName])
      }

      assert.deepStrictEqual(subjectUnderTest.eventHandlerFunctions, expectedEvents)
    })
  })

  describe('apply', () => {
    it('should call the event handler for a registered event when incoming', async () => {
      const expectedEvent = { name: 'event1' }
      let handlerCallCount = 0

      subjectUnderTest.registerEvent('event1', event => {
        assert.deepStrictEqual(event, expectedEvent)
        handlerCallCount++
      })

      await subjectUnderTest.apply(expectedEvent)

      assert.strictEqual(handlerCallCount, 1)
    })

    it('should log an error and do nothing when called for an event that is unknown/unregistered', async () => {
      let loggerCallCount = 0
      let handlerCallCount = 0

      logger.error = () => loggerCallCount++

      subjectUnderTest.registerEvent('event1', () => handlerCallCount)
      subjectUnderTest.registerEvent('event2', () => handlerCallCount)
      subjectUnderTest.registerEvent('event3', () => handlerCallCount)

      await subjectUnderTest.apply({ name: 'unknownEvent' })

      assert.strictEqual(loggerCallCount, 1)
      assert.strictEqual(handlerCallCount, 0)
    })
  })

  describe('createEvent', () => {
    it('should create an event object out of the passed name and payload', () => {
      const expectedName = 'event1'
      const expectedPayload = { p1: 'lol', p2: 'troll', p3: 'roflmao' }

      subjectUnderTest.createEvent(expectedName, expectedPayload)
        .should.be.an('object')
        .that.includes({ name: expectedName, payload: expectedPayload })
        .and.has.property('time')
    })

    it('should create an event object with empty payload if only name was passed', () => {
      const expectedName = 'event1'

      subjectUnderTest.createEvent(expectedName)
        .should.be.an('object')
        .that.deep.includes({ name: expectedName, payload: {} })
        .and.has.property('time')
    })
  })
})
