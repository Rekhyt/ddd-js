// glue code
const Runner = require('./Runner')

// aggregate base classes
const BaseEntity = require('./BaseEntity')
const RootEntity = require('./RootEntity')
const ReadModel = require('./ReadModel')
const Saga = require('./Saga')

// command & event handling
const CommandDispatcherLocal = require('./CommandDispatcherLocal')
const EventDispatcherLocal = require('./EventDispatcherLocal')
const EventDispatcherEventEmitter = require('./EventDispatcherEventEmitter')

// storage
const EventStoreJsonFile = require('./EventStoreJsonFile')

// errors
const InvalidTypeError = require('./GenericErrors/InvalidTypeError')
const InvalidArgumentError = require('./GenericErrors/InvalidArgumentError')
const OutdatedEntityError = require('./GenericErrors/OutdatedEntityError')
const SagaError = require('./GenericErrors/SagaError')
const ValidationError = require('./GenericErrors/ValidationError')

// value objects
const DateTime = require('./ValueObject/DateTime')
const EmailAddress = require('./ValueObject/EmailAddress')
const IntegerVersion = require('./ValueObject/IntegerVersion')
const StringValue = require('./ValueObject/StringValue')
const Enum = require('./ValueObject/Enum')

module.exports = {
  Runner,

  BaseEntity,
  RootEntity,
  ReadModel,
  Saga,

  CommandDispatcherLocal,

  EventDispatcherLocal,
  EventDispatcherEventEmitter,

  EventStoreJsonFile,

  InvalidTypeError,
  InvalidArgumentError,
  OutdatedEntityError,
  SagaError,
  ValidationError,

  DateTime,
  EmailAddress,
  IntegerVersion,
  StringValue,
  Enum
}
