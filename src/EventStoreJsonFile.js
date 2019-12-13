const fs = require('fs')

/**
 * @implements EventStore
 */
class EventStoreJsonFile {
  /**
   * @param {string} path
   * @param {number} saveInterval in ms
   */
  constructor (path, saveInterval = 5000) {
    const fileContents = fs.readFileSync(path, { encoding: 'utf8' })

    this._path = path
    this._intervalTime = saveInterval
    this._content = fileContents ? JSON.parse(fileContents.toString()) : { events: [] }
    this._interval = setInterval(() => this.saveFile(), this._intervalTime)

    // istanbul ignore next
    process.on('SIGINT', () => {
      this.stopSaving()
      this.saveFile()
      process.exit(0)
    })
  }

  stopSaving () {
    clearInterval(this._interval)
    this._interval = null
  }

  startSaving (newInterval = null) {
    if (this._interval) this.stopSaving()

    if (newInterval !== null) this._intervalTime = newInterval
    this._interval = setInterval(() => this.saveFile(), this._intervalTime)
  }

  saveFile () {
    fs.writeFileSync(this._path, JSON.stringify(this._content, null, 2))
  }

  async save (event) {
    return (this._content.events.push(JSON.parse(JSON.stringify(event))) - 1).toString()
  }

  async get (eventId) {
    return JSON.parse(JSON.stringify(this._content.events[eventId]))
  }

  async getAll () {
    return Object.values(this._content.events).map(event => JSON.parse(JSON.stringify(event)))
  }

  async getDateRange (from, to = undefined) {
    return []
  }
}

module.exports = EventStoreJsonFile
