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

    process.on('SIGINT', () => this._saveFile())
    setInterval(() => this._saveFile(), 5000)
  }

  async save (event) {
    this._content.events.push(event)
  }

  async get (eventId) {
    return this._content.events[eventId]
  }

  async getDateRange (from, to = undefined) {
    return []
  }

  _saveFile () {
    fs.writeFileSync(this._path, JSON.stringify(this._content, null, 2))
  }
}

module.exports = EventRepositoryJsonFile
