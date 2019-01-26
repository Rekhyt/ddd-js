const assert = require('assert')

const EventDispatcherLocal = require('../../src/EventDispatcherLocal')

describe('EventDispatcherLocal', () => {
  let subjectUnderTest
  let logger
  let eventRepository

  beforeEach(() => {
    logger = {
      trace: (...args) => {},
      debug: (...args) => {},
      info: (...args) => {},
      warn: (...args) => console.log(args),
      error: (...args) => console.log(args)
    }

    eventRepository = {
      save: (...args) => {}
    }

    subjectUnderTest = new EventDispatcherLocal(logger, eventRepository)
  })

  describe('publish', () => {
    it('should publish a given event to all subscribed handlers', async () => {
      let handler1CallCounter = 0
      let handler2CallCounter = 0

      const handler1 = {
        apply: async () => { handler1CallCounter++; return [] }
      }

      const handler2 = {
        apply: async () => { handler2CallCounter++; return [] }
      }

      subjectUnderTest.subscribe('event1', handler1)
      subjectUnderTest.subscribe('event1', handler2)
      await subjectUnderTest.publish({ name: 'event1' })

      assert.strictEqual(handler1CallCounter, 1)
      assert.strictEqual(handler2CallCounter, 1)
    })

    it('should log an error if no handler is subscribed for an incoming event', async () => {
      let loggerCallCount = 0

      logger.error = () => { loggerCallCount++ }

      await subjectUnderTest.publish({ name: 'event' })

      assert.strictEqual(loggerCallCount, 1)
    })

    it('should save the event to its event repository', async () => {
      let saveCallCount = 0
      let expectedEvent = { name: 'event', time: new Date().toISOString(), payload: { p1: 'test', p2: 'lol' } }

      eventRepository.save = async event => {
        assert.deepStrictEqual(event, expectedEvent)
        saveCallCount++
      }

      subjectUnderTest.subscribe('event', () => {})

      await subjectUnderTest.publish(expectedEvent)

      assert.strictEqual(saveCallCount, 1)
    })

    it('should not save the event when the "save" flag is false', async () => {
      let saveCallCount = 0
      let expectedEvent = { name: 'event', time: new Date().toISOString(), payload: { p1: 'test', p2: 'lol' } }

      eventRepository.save = async () => {
        saveCallCount++
      }

      subjectUnderTest.subscribe('event', () => {})

      await subjectUnderTest.publish(expectedEvent, false)

      assert.strictEqual(saveCallCount, 0)
    })
  })
})
