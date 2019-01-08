const Aggregate = require('./src/Aggregate')
const CommandDispatcherLocal = require('./src/CommandDispatcherLocal')
const ConnectionHandlerSocketIo = require('./src/ConnectionHandlerSocketIo')
const EventDispatcherLocal = require('./src/EventDispatcherLocal')

module.exports = {
  Aggregate,
  CommandDispatcherLocal,
  ConnectionHandlerSocketIo,
  EventDispatcherLocal
}
