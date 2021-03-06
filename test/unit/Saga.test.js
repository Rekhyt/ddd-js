const assert = require('assert')
const chai = require('chai')
const sinon = require('sinon')

chai.use(require('chai-as-promised'))
chai.should()

const uuid = require('uuid/v4')

const Saga = require('../../src/Saga')

const Impl = class extends Saga {
  setup () {}
}

describe('Saga', () => {
  let subjectUnderTest
  let logger
  let commandDispatcher

  beforeEach(() => {
    logger = {
      trace: () => {},
      debug: () => {},
      info: () => {},
      warn: (...args) => console.log(args),
      error: (...args) => console.log(args),
      fatal: (...args) => console.log(args)
    }

    commandDispatcher = {
      subscribe: () => {}
    }

    subjectUnderTest = new Impl(logger, commandDispatcher, () => 'id')
  })

  describe('constructor', () => {
    it('should use uuid/v4 as ID generator if none was passed', () => {
      const subjectUnderTest = new Impl(logger, commandDispatcher)
      subjectUnderTest._idGenerator.should.equal(uuid)
    })

    it('should use the passed ID generator', () => {
      const subjectUnderTest = new Impl(logger, commandDispatcher, 'test')
      subjectUnderTest._idGenerator.should.equal('test')
    })
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
    it('should return an empty array', async () => {
      subjectUnderTest.registerCommand('command1', () => {})
      await subjectUnderTest.getAffectedEntities().should.eventually.deep.equal([])
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

  describe('provision', () => {
    it('should start a saga and return its identifier', () => {
      subjectUnderTest.provision().should.be.a('string').that.equals('id')
      subjectUnderTest._runningSagas.should.be.an('object').with.deep.property('id', { className: 'Impl', tasks: {} })
    })
  })

  describe('addTask', () => {
    it('should throw an error if no saga with given ID was provisioned', () => {
      (() => subjectUnderTest.addTask(
        'unknown-id',
        { name: 'Hotel.bookRoom', time: 'now', payload: {} },
        'Hotel',
        () => {}
      )).should.throw(`No saga found with given identifier unknown-id.`)
    })

    it('should add the task to the list with status "added"', () => {
      const rollbackHandler = () => {}

      subjectUnderTest.provision().should.be.a('string').that.equals('id')
      subjectUnderTest.addTask(
        'id',
        'Hotel',
        { name: 'Hotel.bookRoom', time: 'now', payload: {} },
        rollbackHandler,
        999
      )
      subjectUnderTest._runningSagas.should.be.an('object').with.deep.property('id', {
        className: 'Impl',
        tasks: { 'Hotel.bookRoom': {
          command: { name: 'Hotel.bookRoom', time: 'now', payload: {} },
          entity: 'Hotel',
          rollbackHandler,
          status: 'added',
          timeout: 999
        } }
      })
    })
  })

  describe('run', () => {
    it('should throw an error if no saga with given ID was provisioned', async () => {
      await subjectUnderTest.run('unknown-id')
        .should.eventually.be.rejectedWith(`No saga found with given identifier unknown-id.`)
    })

    it('should dispatch the commands for its tasks', async () => {
      const command1 = { name: 'Hotel.bookRoom', time: 'now', payload: { roomNo: 42 } }
      const command2 = { name: 'Car.rent', time: 'now', payload: { carNo: 1337 } }

      const rollbackHandler = sinon.stub()
      commandDispatcher.dispatch = sinon.stub().resolves()

      subjectUnderTest.provision().should.be.a('string').that.equals('id')

      subjectUnderTest.addTask('id', 'Hotel', command1, rollbackHandler)
      subjectUnderTest.addTask('id', 'Car', command2, rollbackHandler)

      await subjectUnderTest.run('id')

      sinon.assert.calledTwice(commandDispatcher.dispatch)
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { ...command1, sagaId: 'id' })
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { ...command2, sagaId: 'id' })

      sinon.assert.notCalled(rollbackHandler)
    })

    it('should throw an error and roll back done or timed out tasks if any of the tasks fail', async () => {
      const command1 = { name: 'Hotel.bookRoom', time: 'now', payload: { roomNo: 42 } }
      const command2 = { name: 'Car.rent', time: 'now', payload: { carNo: 1337 } }
      const command3 = { name: 'Flight.book', time: 'now', payload: { flightNo: 314 } }
      const rollbackCommand1 = { name: 'Hotel.cancelRoom', time: 'now', payload: { roomNo: 42 } }
      const rollbackCommand3 = { name: 'Flight.cancel', time: 'now', payload: { flightNo: 42 } }
      const error = new Error('Car not available')

      const rollbackHandler1 = sinon.stub().returns(rollbackCommand1)
      const rollbackHandler2 = sinon.stub()
      const rollbackHandler3 = sinon.stub().returns(rollbackCommand3)

      commandDispatcher.dispatch = sinon.stub()
        .onFirstCall().resolves()
        .onSecondCall().rejects(error)
        .onThirdCall().returns(new Promise(resolve => setTimeout(resolve, 10)))

      subjectUnderTest.provision().should.be.a('string').that.equals('id')

      subjectUnderTest.addTask('id', 'Hotel', command1, rollbackHandler1)
      subjectUnderTest.addTask('id', 'Car', command2, rollbackHandler2)
      subjectUnderTest.addTask('id', 'Flight', command3, rollbackHandler3, 0)

      await subjectUnderTest.run('id').should.be.rejectedWith('Errors on entities Car, Flight')

      sinon.assert.callCount(commandDispatcher.dispatch, 5)
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { ...command1, sagaId: 'id' })
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { ...command2, sagaId: 'id' })
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { ...command3, sagaId: 'id' })
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { ...rollbackCommand1, sagaId: 'id' })
      sinon.assert.calledWithExactly(commandDispatcher.dispatch, { ...rollbackCommand3, sagaId: 'id' })

      sinon.assert.calledOnce(rollbackHandler1)
      sinon.assert.notCalled(rollbackHandler2)
      sinon.assert.calledOnce(rollbackHandler3)
    })
  })

  it('should log a fatal error if the rollback fails', async () => {
    const command1 = { name: 'Hotel.bookRoom', time: 'now', payload: { roomNo: 42 } }
    const command2 = { name: 'Car.rent', time: 'now', payload: { carNo: 1337 } }
    const rollbackCommand1 = { name: 'Hotel.cancelRoom', time: 'now', payload: { roomNo: 42 } }
    const error = new Error('Car not available')
    const rollbackError = new Error('Hotel service temporarily unavailable')

    const rollbackHandler1 = sinon.stub().returns(rollbackCommand1)
    const rollbackHandler2 = sinon.stub()

    logger.fatal = sinon.stub()

    commandDispatcher.dispatch = sinon.stub()
      .onFirstCall().resolves()
      .onSecondCall().rejects(error)
      .onThirdCall().rejects(rollbackError)

    subjectUnderTest.provision().should.be.a('string').that.equals('id')

    subjectUnderTest.addTask('id', 'Hotel', command1, rollbackHandler1)
    subjectUnderTest.addTask('id', 'Car', command2, rollbackHandler2)

    await subjectUnderTest.run('id').should.be.rejectedWith('Errors on entity Car')

    sinon.assert.calledThrice(commandDispatcher.dispatch)
    sinon.assert.calledWithExactly(commandDispatcher.dispatch, { ...command1, sagaId: 'id' })
    sinon.assert.calledWithExactly(commandDispatcher.dispatch, { ...command2, sagaId: 'id' })
    sinon.assert.calledWithExactly(commandDispatcher.dispatch, { ...rollbackCommand1, sagaId: 'id' })

    sinon.assert.calledOnce(rollbackHandler1)
    sinon.assert.notCalled(rollbackHandler2)

    sinon.assert.calledOnce(logger.fatal)
    sinon.assert.calledWithMatch(logger.fatal, rollbackError, sinon.match.string)
  })
})
