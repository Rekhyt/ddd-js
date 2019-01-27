const assert = require('assert')
const chai = require('chai')
chai.should()

const ReadModel = require('../../src/ReadModel')

const Impl = class ReadModelImpl extends ReadModel {}

describe('ReadModel', () => {
  let subjectUnderTest
  let logger
  let eventDispatcher

  beforeEach(() => {
    logger = {
      trace: (...args) => {},
      debug: (...args) => {},
      info: (...args) => {},
      warn: (...args) => console.log(args),
      error: (...args) => console.log(args)
    }

    eventDispatcher = {
      subscribe: () => {}
    }

    subjectUnderTest = new Impl(logger, eventDispatcher)
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
