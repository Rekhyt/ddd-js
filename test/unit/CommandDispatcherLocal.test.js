const assert = require('assert')

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
      trace: (...args) => {},
      debug: (...args) => {},
      info: (...args) => {},
      warn: (...args) => console.log(args),
      error: (...args) => console.log(args)
    }

    subjectUnderTest = new CommandDispatcherLocal(eventDispatcher, logger)
  })

  describe('subscribe', () => {
    it('should log an error if two handlers are assigned to a command', () => {
      let loggerCallCount = 0

      logger.error = () => {
        loggerCallCount++
      }

      subjectUnderTest.subscribe('command1', {})
      subjectUnderTest.subscribe('command1', {})

      assert.strictEqual(loggerCallCount, 1)
    })
  })

  describe('dispatch', () => {
    it('should dispatch a given command to its subscribed handler', async () => {
      let handlerCallCount = 0

      const handler = {
        execute: () => {
          handlerCallCount++
          return []
        }
      }

      subjectUnderTest.subscribe('command', handler)
      await subjectUnderTest.dispatch({ name: 'command' })

      assert.strictEqual(handlerCallCount, 1)
    })

    it('should publish events resulting from a command', async () => {
      let publishManyCallCount = 0

      const handler = {
        execute: () => {
          return [{ eventNo: 1 }, { eventNo: 2 }]
        }
      }

      eventDispatcher.publishMany = async events => publishManyCallCount++

      subjectUnderTest.subscribe('command', handler)
      await subjectUnderTest.dispatch({ name: 'command' })

      assert.strictEqual(publishManyCallCount, 1)
    })

    it('should dispatch to the former handler if two handlers are subscribed to a command', () => {
      let handler1CallCount = 0
      let handler2CallCount = 0

      logger.error = () => { /* do not log to console, it's expected */
      }

      const handler1 = {
        execute: () => {
          handler1CallCount++
          return []
        }
      }

      const handler2 = {
        execute: () => {
          handler2CallCount++
          return []
        }
      }

      subjectUnderTest.subscribe('command', handler1)
      subjectUnderTest.subscribe('command', handler2)

      subjectUnderTest.dispatch({ name: 'command' })

      assert.strictEqual(handler1CallCount, 1)
      assert.strictEqual(handler2CallCount, 0)
    })

    it('should log an error if no handler is subscribed for an incoming command', () => {
      let loggerCallCount = 0

      logger.error = () => {
        loggerCallCount++
      }

      subjectUnderTest.dispatch({ name: 'command' })

      assert.strictEqual(loggerCallCount, 1)
    })
  })
})
