const fs = require('fs')

/**
 * @implements EventRepository
 */
class EventRepositoryJsonFile {
  /**
   * @param {string} path
   */
  constructor (path) {
    const fileContents = fs.readFileSync(path, { encoding: 'utf8' })

    this._path = path
    this._content = fileContents ? JSON.parse(fileContents) : { events: [] }
    this._interval = setInterval(() => this._saveFile(), 5000)

    process.on('SIGINT', () => {
      clearInterval(this._interval)
      this._saveFile()

      process.exit(0)
    })
  }

  async save (event) {
    this._content.events.push(event)
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

  _saveFile () {
    fs.writeFileSync(this._path, JSON.stringify(this._content, null, 2))
  }
}

module.exports = EventRepositoryJsonFile
