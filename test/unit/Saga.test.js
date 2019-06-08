const assert = require('assert')
const chai = require('chai')
chai.should()

const Saga = require('../../src/Saga')

const Impl = class extends Saga {}

describe('Saga', () => {
  let subjectUnderTest
  let logger
  let commandDispatcher

  beforeEach(() => {
    logger = {
      trace: (...args) => {},
      debug: (...args) => {},
      info: (...args) => {},
      warn: (...args) => console.log(args),
      error: (...args) => console.log(args)
    }

    commandDispatcher = {
      subscribe: () => {}
    }

    subjectUnderTest = new Impl(logger, commandDispatcher)
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
})
