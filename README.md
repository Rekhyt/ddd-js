# ddd-js

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/Rekhyt/ddd-js.svg?branch=master)](https://travis-ci.org/Rekhyt/ddd-js)
[![Coverage Status](https://coveralls.io/repos/github/Rekhyt/ddd-js/badge.svg)](https://coveralls.io/github/Rekhyt/ddd-js)
[![GitHub (pre-)release](https://img.shields.io/github/v/tag/rekhyt/ddd-js?style=flat)](https://github.com/Rekhyt/ddd-js/releases)

Basic / boilerplate JS classes &amp; functions.

**We're still on alpha here, APIs may change any time.**

## Quick Start
The example application will be a small chat that allows sending messages under an alias. Implementation consists of:
* **value objects** for validation of the author's name and the chat text
* a **root entity** that accepts commands, validates input and returns the proper events
* a **read model** keeping an API representation of all messages sent
* an **API** that takes commands and gives access to the read model

<details open>
<summary><b>src/ValueObjects.js</b></summary>

```javascript
const { NonEmptyStringValue } = require('ddd-js')

class Author extends NonEmptyStringValue {}
class ChatText extends NonEmptyStringValue {}

module.exports = { Author, ChatText }
```
</details>

<details>
<summary><b>src/Entities/Message.js</b></summary>

```javascript
const { RootEntity, DateTime } = require('ddd-js')
const { Author, ChatText } = require('./ValueObjects') // see Value Objects

class Message extends RootEntity {
  setup () {
    this.registerCommand(
      'Message.sendMessage',
      command => this.sendMessage(command.payload.author, command.payload.chatText, command.time)
    )
  }

  sendMessage (author, chatText, time) {
    // validate the input through value objects - this will throw an error if a value is invalid, rejecting the command
    new Author(author)
    new ChatText(chatText)
    new DateTime(time)

    // if all good, return the event
    return [this.createEvent('Message.messageSent', { author, chatText, commandTime: time })]
  }
}

module.exports = Message
```
</details>

<details>
<summary><b>src/ReadModel/Messages.js</b></summary>

```javascript
const { ReadModel } = require('ddd-js')

class Messages extends ReadModel {
  setup () {
    this.messages = []
    this.registerEvent(
      'Message.messageSent',
      event => this.messageSent(event.payload.author, event.payload.chatText, event.payload.commandTime)
    )
  }

  messageSent (author, chatText, commandTime) { this.messages.push({ author, chatText, time: commandTime }) }

  get messages () { return this.messages }
}

module.exports = Messages
```
</details>

<details>
<summary><b>src/app.js</b></summary>

```javascript
const bunyan = require('bunyan')
const { Runner } = require('ddd-js')
const Message = require('./Entities/Message') // see Root Entity
const Messages = require('./ReadModels/Messages') // see Read Model
const logger = bunyan.createLogger({ name: 'chat' })

Runner.createWithExpress(logger, '../eventstore.json')
  .attachRootEntity(Message)
  .attachReadModel('/messages', Messages, 'messages')
  .replayHistory().then(runner => runner.startServer(8000))
```
</details>

Run `node src/app.js` - There's your API! You can now `POST` commands to `http://localhost:8000/command` and `GET` messages from
`http://localhost:8000/messages`.

<details>
<summary>Command Example:</summary>

```http request
POST /command
Host: localhost:8000
Content-Type: application/json

{"name":"Message.sendMessage","time":"2019-12-08 16:06:37","payload":{"author":"Bob","chatText":"Hey, has anyone seen Jack recently!?"}}
```
</details>

## Entity Versioning & Optimistic Lock
To utilize optmistic lock functionality, base your entity class on `BaseEntity` and register a function that returns
all entities that will be affected by a command.

The `CommandDispatcher` will now monitor entity versions and block sending events if versions become inconsistent.

<details>
<summary><b>Example:</b> To assure that the fuel tank of a car in our car park cannot be stored with a valie below zero,
we'll return the affected car entity in the affectedEntitiesHandler for the `removeFuel` command.
</summary>

```javascript
const { RootEntity, BaseEntity } = require('ddd-js')

class Car extends BaseEntity {
  constructor (fuelLevel) {
    super()
    this.fuelLevel = fuelLevel
  }
}

class CarPool extends RootEntity {
  constructor () { this.cars = {} }

  setup () {
    this.registerCommand(
    'removeFuel',                                             // command name
    command => this.removeFuel(carId, liters)),               // command handler function
    command => { return [this.cars[command.payload.carId]] }, // function returning affected entities per command
    5                                                         // number of retries for optimistic lock until giving up
  }

  removeFuel (carId, liters) {
    if (this.cars[carId].fuelLevel - liters < 0) throw new Error('This is more than is left in the tank.')
    return [this.createEvent('fuelRemoved', { carId, liters })]
  }
}
```
</details>

## Sagas
To support transactions over multiple aggregates while respecting bounded contexts a saga can be used. To do so, extend
the Saga class, register a command that triggers it and add tasks and their according rollback tasks and then let the
Saga run.

<details>
<summary><b>Example:</b> If someone rents a car, it should be marked unavailable. At the same time, the customer's
credit card should be debited. Only if both actions succeed the process is considered complete.
If the car cannot be reserved the customer should get their money back. If the amount can't be debited the car should be
freed again.</summary>

```javascript
const { Saga } = require('ddd-js')

class RentCar extends Saga {
  setup () {
    this.registerCommand('rentCar', async command => {
      // prepare a new run of the Saga and get an identifier for that
      const id = this.provision()

      this.addTask(
        id, 'Car',                                                         // Saga ID and entity name
        { ...command, name: 'reserveCar', time: new Date().toJSON() },     // command to be sent
        () => ({ ...command, name: 'freeCar', time: new Date().toJSON() }) // roll back handler if any other task fails
      )

      this.addTask(
        id, 'Payment',
        { ...command, name: 'debitAmount', time: new Date().toJSON() },
        () => ({ ...command, name: 'payAmount', time: new Date().toJSON() })
      )

      await this.run(id)

      return [] // a saga could return its own events after it has finished
    })
  }
}
```
</details>

### Success Of A Saga
A saga will succeed only if every task succeeded. It will then emit the events that were returned by the root entities. 

### Failure Of A Saga
A saga will fail if
* one or more commands failed to be executed
* one or more commands timed out

It will then send "rollback" commands to every root entity that succeeded or timed out.