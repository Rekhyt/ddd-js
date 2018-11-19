const assert = require('assert')

const CommandDispatcherLocal = require('../../src/CommandDispatcherLocal')

describe('CommandDispatcherLocal', () => {
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

    subjectUnderTest = new CommandDispatcherLocal(logger)
  })

  describe('subscribe', () => {
    it('should log a warning if two handlers are assigned to a command', () => {
      let loggerCallCount = 0

      logger.warn = () => { loggerCallCount++ }

      subjectUnderTest.subscribe('command1', {})
      subjectUnderTest.subscribe('command1', {})

      assert.strictEqual(loggerCallCount, 1)
    })
  })

  describe('dispatch', () => {
    it('should dispatch a given command to its subscribed handler', () => {
      let handlerCallCount = 0

      const handler = {
        handle: () => { handlerCallCount++; return [] }
      }

      subjectUnderTest.subscribe('command', handler)
      subjectUnderTest.dispatch({ name: 'command' })

      assert.strictEqual(handlerCallCount, 1)
    })

    it('should dispatch to the former handler if two handlers are subscribed to a command', () => {
      let handler1CallCount = 0
      let handler2CallCount = 0

      logger.warn = () => { /* do not log to console, it's expected */ }

      const handler1 = {
        handle: () => { handler1CallCount++; return [] }
      }

      const handler2 = {
        handle: () => { handler2CallCount++; return [] }
      }

      subjectUnderTest.subscribe('command', handler1)
      subjectUnderTest.subscribe('command', handler2)

      subjectUnderTest.dispatch({ name: 'command' })

      assert.strictEqual(handler1CallCount, 1)
      assert.strictEqual(handler2CallCount, 0)
    })

    it('should log a warning if no handler is subscribed for an incoming command', () => {
      let loggerCallCount = 0

      logger.warn = () => { loggerCallCount++ }

      subjectUnderTest.dispatch({ name: 'command' })

      assert.strictEqual(loggerCallCount, 1)
    })
  })
})
