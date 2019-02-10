const assert = require('assert')
const chai = require('chai')
chai.should()

const EventDispatcherEventEmitter = require('../../src/EventDispatcherEventEmitter')

describe('EventDispatcherEventEmitter', () => {
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

    subjectUnderTest = new EventDispatcherEventEmitter(logger, eventRepository)
  })

  afterEach(() => {
    subjectUnderTest.removeAllListeners()
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

  describe('publishMany', () => {
    it('should publish all events passed to it', async () => {
      const publishedEvents = [{ name: 'event1' }, { name: 'event2' }, { name: 'event3' }]

      const handledEvents = []

      eventRepository.save = async () => {}

      subjectUnderTest.subscribe('event1', { apply: event => handledEvents.push(event) })
      subjectUnderTest.subscribe('event2', { apply: event => handledEvents.push(event) })
      subjectUnderTest.subscribe('event3', { apply: event => handledEvents.push(event) })

      await subjectUnderTest.publishMany(publishedEvents)

      handledEvents.should.be.an('array').and.deep.include.members(publishedEvents)
      publishedEvents.should.be.an('array').and.deep.include.members(handledEvents)
    })

    it('should save all events passed to it when the "save" flag is true', async () => {
      const publishedEvents = [{ name: 'event1' }, { name: 'event2' }, { name: 'event3' }]

      let saveCallCount = 0
      const handledEvents = []
      const savedEvents = []

      eventRepository.save = async event => {
        savedEvents.push(event)
        saveCallCount++
      }

      subjectUnderTest.subscribe('event1', { apply: event => handledEvents.push(event) })
      subjectUnderTest.subscribe('event2', { apply: event => handledEvents.push(event) })
      subjectUnderTest.subscribe('event3', { apply: event => handledEvents.push(event) })

      await subjectUnderTest.publishMany(publishedEvents)

      savedEvents.should.be.an('array').and.includes.members(publishedEvents)
      publishedEvents.should.be.an('array').and.includes.members(savedEvents)
      saveCallCount.should.equal(3)

      handledEvents.should.be.an('array').and.deep.include.members(publishedEvents)
      publishedEvents.should.be.an('array').and.deep.include.members(handledEvents)
    })

    it('should not save any of the events passed to it when the "save" flag is false', async () => {
      const publishedEvents = [{ name: 'event1' }, { name: 'event2' }, { name: 'event3' }]

      let saveCallCount = 0
      const handledEvents = []
      const savedEvents = []

      eventRepository.save = async event => {
        savedEvents.push(event)
        saveCallCount++
      }

      subjectUnderTest.subscribe('event1', { apply: event => handledEvents.push(event) })
      subjectUnderTest.subscribe('event2', { apply: event => handledEvents.push(event) })
      subjectUnderTest.subscribe('event3', { apply: event => handledEvents.push(event) })

      await subjectUnderTest.publishMany(publishedEvents, false)

      assert.deepStrictEqual(savedEvents, [])
      saveCallCount.should.equal(0)

      handledEvents.should.be.an('array').and.deep.include.members(publishedEvents)
      publishedEvents.should.be.an('array').and.deep.include.members(handledEvents)
    })
  })

  describe('replayAll', () => {
    it('should publish all events in the exact same order returned from repository and not save them again', async () => {
      const eventsFromStorage = [{ name: 'event1' }, { name: 'event2' }, { name: 'event3' }]

      let saveCallCount = 0
      const handledEvents = []
      const savedEvents = []

      eventRepository.getAll = async () => eventsFromStorage

      eventRepository.save = async event => {
        savedEvents.push(event)
        saveCallCount++
      }

      subjectUnderTest.subscribe('event1', { apply: event => handledEvents.push(event) })
      subjectUnderTest.subscribe('event2', { apply: event => handledEvents.push(event) })
      subjectUnderTest.subscribe('event3', { apply: event => handledEvents.push(event) })

      await subjectUnderTest.replayAll()

      assert.deepStrictEqual(savedEvents, [])
      saveCallCount.should.equal(0)

      assert.deepStrictEqual(handledEvents, eventsFromStorage)
    })
  })
})
