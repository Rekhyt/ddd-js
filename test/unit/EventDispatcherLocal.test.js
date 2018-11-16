const assert = require('assert')

const EventDispatcherLocal = require('../../src/EventDispatcherLocal')

describe('EventDispatcherLocal', () => {
  let subjectUnderTest
  let logger

  beforeEach(() => {
    logger = {
      debug: (...args) => console.log(args),
      warn: (...args) => console.log(args)
    }

    // no-inspect
    // noinspection JSCheckFunctionSignatures
    subjectUnderTest = new EventDispatcherLocal(logger)
  })

  describe('dispatch', () => {
    it('should dispatch a given event to all subscribed handlers', async () => {
      let handler1CallCounter = 0
      let handler2CallCounter = 0

      const handler1 = {
        handle: async () => { handler1CallCounter++; return [] }
      }

      const handler2 = {
        handle: async () => { handler2CallCounter++; return [] }
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
        handle: async () => { handler1CallCounter++; return [{ name: 'event2' }, { name: 'event3' }] }
      }

      const handler2 = {
        handle: async () => { handler2CallCounter++; return [{ name: 'event3' }] }
      }

      const handler3 = {
        handle: async () => { handler3CallCounter++; return [] }
      }

      subjectUnderTest.subscribe('event1', handler1)
      subjectUnderTest.subscribe('event2', handler2)
      subjectUnderTest.subscribe('event3', handler3)
      await subjectUnderTest.dispatch({ name: 'event1' })

      assert.strictEqual(handler1CallCounter, 1)
      assert.strictEqual(handler2CallCounter, 1)
      assert.strictEqual(handler3CallCounter, 2)
    })
  })
})
