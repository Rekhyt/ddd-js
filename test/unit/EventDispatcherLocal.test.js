const assert = require('assert')

const EventDispatcherLocal = require('../../src/EventDispatcherLocal')

describe('EventDispatcherLocal', () => {
  let subjectUnderTest
  let logger

  beforeEach(() => {
    logger = {
      trace: (...args) => {},
      debug: (...args) => {},
      info: (...args) => {},
      warn: (...args) => console.log(args),
      error: (...args) => console.log(args)
    }

    subjectUnderTest = new EventDispatcherLocal(logger)
  })

  describe('dispatch', () => {
    it('should dispatch a given event to all subscribed handlers', async () => {
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
      await subjectUnderTest.dispatch({ name: 'event1' })

      assert.strictEqual(handler1CallCounter, 1)
      assert.strictEqual(handler2CallCounter, 1)
    })

    it('should dispatch events returned by events to all subscribed handlers', async () => {
      let handler1CallCounter = 0
      let handler2CallCounter = 0
      let handler3CallCounter = 0

      const handler1 = {
        apply: async () => { handler1CallCounter++; return [{ name: 'event2' }, { name: 'event3' }] }
      }

      const handler2 = {
        apply: async () => { handler2CallCounter++; return [{ name: 'event3' }] }
      }

      const handler3 = {
        apply: async () => { handler3CallCounter++; return [] }
      }

      subjectUnderTest.subscribe('event1', handler1)
      subjectUnderTest.subscribe('event2', handler2)
      subjectUnderTest.subscribe('event3', handler3)
      await subjectUnderTest.dispatch({ name: 'event1' })

      assert.strictEqual(handler1CallCounter, 1)
      assert.strictEqual(handler2CallCounter, 1)
      assert.strictEqual(handler3CallCounter, 2)
    })

    it('should log a warning if no handler is subscribed for an incoming event', async () => {
      let loggerCallCount = 0

      logger.warn = () => { loggerCallCount++ }

      await subjectUnderTest.dispatch({ name: 'event' })

      assert.strictEqual(loggerCallCount, 1)
    })
  })
})
