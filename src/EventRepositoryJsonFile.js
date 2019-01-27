const fs = require('fs')

/**
 * @implements EventRepository
 */
class EventRepositoryJsonFile {
  /**
   * @param {string} path
   * @param {number} saveInterval in ms
   */
  constructor (path, saveInterval = 5000) {
    const fileContents = fs.readFileSync(path, { encoding: 'utf8' })

    this._path = path
    this._intervalTime = saveInterval
    this._content = fileContents ? JSON.parse(fileContents) : { events: [] }
    this._interval = setInterval(() => this.saveFile(), this._intervalTime)
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
    return (this._content.events.push(event) - 1).toString()
  }

  async get (eventId) {
    return this._content.events[eventId]
  }

  async getAll () {
    return Object.values(this._content.events)
  }

  async getDateRange (from, to = undefined) {
    return []
  }
}

module.exports = EventRepositoryJsonFile
