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

<details>
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

  messageSent (author, chatText, commandTime) { this.messages = { author, chatText, time: commandTime } }

  get messages () { return this.messages }
}
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
The default command dispatcher supports an optimistic lock on affected entities that implement the `Versionable` interface.
Alternatively you can base your entity on `BaseEntity` which supports versioning out of the box.

When registering a command handler, you can also register a function that returns the affected entities as an array.

The dispatcher will now store the current version before executing the command and check if it's still the same before
emitting the resulting events. If it is not it will retry a defined number of times or 5 times by default.

<details>
<summary><b>Example:</b> To avoid the fuel tank of a car in our car park to be emptied below zero, we'll return the affected car
entity in the affectedEntitiesHandler for the "removeFuel" command. The command dispatcher will take care of version
increments, checks and retries for that command from now on.</summary>

```javascript
const { RootEntity, BaseEntity } = require('ddd-js')

class Car extends BaseEntity {
  constructor (fuelLevel) {
    super()
    this.fuelLevel = fuelLevel
  }
}

class CarPool extends RootEntity {
  setup () {
    this.registerCommand('removeFuel',
      (carId, liters) => {
        if (this.cars[carId].fuelLevel - liters < 0) throw new Error('This is more than is left in the tank.')
        return [this.createEvent('fuelRemoved', { carId, liters })]
      },
      command => { return [this.cars[command.payload.carId]] }
    )
  }
}
```
</details>

## Sagas
To support transactions over multiple aggregates while respecting bounded contexts a saga can be used. To do so, extend
the Saga class, register a command that triggers it and add tasks (commands to the root entities) and their according
rollback tasks and then let the Saga run.

### Success Of A Saga
A saga will succeed only if every task succeeded. It will then emit the events that were returned by the root entities. 

### Failure Of A Saga
A saga will fail if
* one or more commands failed to be executed
* one or more commands timed out

It will then send "rollback" commands to every root entity that succeeded or timed out.

<details>
<summary><b>Example:</b> If someone rents a car, it should be marked unavailable. At the same time, the custmer's credit card should be
debited. Only if both actions succeed the process is considered complete. If the car cannot be reserved the customer
should get their money back. If the amount can't be debited the car should be freed again.</summary>

```javascript
const { Saga } = require('ddd-js')

class RentCar extends Saga {
  setup () {
    this.registerCommand('rentCar', async command => {
      // prepare a new Saga run and get an identifier for it
      const id = this.provision()

      this.addTask(id, { ...command, name: 'reserveCar', time: new Date().toJSON() }, 'Car', () => {
        return { ...command, name: 'freeCar', time: new Date().toJSON() }
      })

      this.addTask(id, { ...command, name: 'debitAmount', time: new Date().toJSON() }, 'Payment', () => {
        return { ...command, name: 'payAmount', time: new Date().toJSON() }
      })

      await this.run(id)

      return [] // a saga could return its own events after it has finished; entity events are handled internally
    })
  }
}
```
</details>