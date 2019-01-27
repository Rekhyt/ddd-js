const assert = require('assert')
const proxyquire = require('proxyquire')

let fs = {}
const EventRepositoryJsonFile = proxyquire('../../src/EventRepositoryJsonFile', { fs })

describe('EventRepositoryJsonFile', () => {
  let subjectUnderTest

  beforeEach(() => {
    fs.readFileSync = () => {}
    fs.writeFileSync = () => {}

    subjectUnderTest = new EventRepositoryJsonFile('...', 10)
  })

  afterEach(() => {
    clearInterval(subjectUnderTest._interval)
    subjectUnderTest._interval = null
  })

  describe('construct', () => {
    const expectedPath = 'path/to/json'

    beforeEach(() => {
      // stop interval so the test subject can be replaced
      clearInterval(subjectUnderTest._interval)
      subjectUnderTest._interval = null
    })

    it('should read the file contents upon instantiation', async () => {
      let called = false
      fs.readFileSync = path => {
        assert.strictEqual(path, expectedPath)
        called = true
      }

      subjectUnderTest = new EventRepositoryJsonFile(expectedPath)
      assert.strictEqual(called, true)
    })

    it('should parse the file contents upon instantiation if not empty', async () => {
      const expectedContents = { test: 123 }

      fs.readFileSync = path => {
        assert.strictEqual(path, expectedPath)
        return JSON.stringify(expectedContents)
      }

      subjectUnderTest = new EventRepositoryJsonFile(expectedPath)

      assert.deepStrictEqual(subjectUnderTest._content, expectedContents)
    })

    it('should save the file contents in specified interval', async () => {
      let callCount = 0
      fs.writeFileSync = path => {
        assert.strictEqual(path, expectedPath)
        callCount++
      }

      subjectUnderTest = new EventRepositoryJsonFile(expectedPath, 10)
      await new Promise(resolve => setTimeout(() => resolve(), 35))

      assert.strictEqual(callCount, 3)
    })
  })

  describe('stopSaving', () => {
    it('should stop saving in interval', async () => {
      let writeCounter = 0
      fs.writeFileSync = () => writeCounter++
      subjectUnderTest.stopSaving()

      await new Promise(resolve => setTimeout(() => resolve(), 35))

      assert.strictEqual(writeCounter, 0)
    })
  })

  describe('startSaving', () => {
    beforeEach(() => {
      // stop interval so the test subject can be replaced
      clearInterval(subjectUnderTest._interval)
      subjectUnderTest._interval = null
    })

    it('should start saving in intially set interval', async () => {
      let callCount = 0
      fs.writeFileSync = path => {
        assert.strictEqual(path, '...')
        callCount++
      }

      subjectUnderTest.startSaving()
      await new Promise(resolve => setTimeout(() => resolve(), 35))

      assert.strictEqual(callCount, 3)
    })

    it('should start saving in newly set interval', async () => {
      let callCount = 0
      fs.writeFileSync = path => {
        assert.strictEqual(path, '...')
        callCount++
      }

      subjectUnderTest.startSaving(20)
      await new Promise(resolve => setTimeout(() => resolve(), 50))

      assert.strictEqual(callCount, 2)
    })

    it('should clear and set a new interval if saving is already active', async () => {
      let callCount = 0

      subjectUnderTest.startSaving(500)
      const oldInterval = subjectUnderTest._interval

      subjectUnderTest.startSaving(10)
      const newInterval = subjectUnderTest._interval

      assert.strictEqual(oldInterval !== newInterval, true)
    })
  })

  describe('save', () => {
    it('should return an ID', async () => {
      assert.strictEqual(await subjectUnderTest.save({}), '0')
    })
  })

  describe('get', () => {
    it('should return the event with the proper ID', async () => {
      const expectedEvent = { name: 'event1' }
      const id = await subjectUnderTest.save(expectedEvent)
      const event = await subjectUnderTest.get(id)

      assert.strictEqual(event, expectedEvent)
    })
  })

  describe('getAll', () => {
    it('should return the saved list of events', async () => {
      const expectedEvents = [{ name: 'event1' }, { name: 'event2' }, { name: 'event3' }]

      for (const event of expectedEvents) await subjectUnderTest.save(event)

      assert.deepStrictEqual(await subjectUnderTest.getAll(), expectedEvents)
    })
  })

  describe('getDataRange', () => {
    it('should return an empty list', async () => {
      assert.deepStrictEqual(await subjectUnderTest.getDateRange('lol'), [])
    })
  })
})
