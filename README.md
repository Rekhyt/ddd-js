# ddd-js

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/Rekhyt/ddd-js.svg?branch=master)](https://travis-ci.org/Rekhyt/ddd-js)
[![Coverage Status](https://coveralls.io/repos/github/Rekhyt/ddd-js/badge.svg)](https://coveralls.io/github/Rekhyt/ddd-js)
[![GitHub (pre-)release](https://img.shields.io/github/release/Rekhyt/ddd-js/all.svg)](https://github.com/Rekhyt/ddd-js/releases)

Basic / boilerplate JS classes &amp; functions.

## Quick Start
The example application will be a small chat that allows sending messages under an alias.

### Value Objects
**src/ValueObjects.js**
```javascript
const { NonEmptyStringValue } = require('ddd-js')

class Author extends NonEmptyStringValue {}
class ChatText extends NonEmptyStringValue {}

module.exports = { Author, ChatText }
```

### Root Entity
**src/Entities/Message.js**
```javascript
const { RootEntity, DateTime } = require('ddd-js')
const { Author, ChatText } = require('./ValueObjects') // see Value Objects

class Message extends RootEntity {
  setup () {
    this.messages = []
    this.registerCommand(
      'Message.sendMessage',
      command => this.sendMessage(command.payload.author, command.payload.chatText, command.time)
    )
    this.registerEvent(
      'Message.messageSent',
      event => this.messageSent(event.payload.author, event.payload.chatText, event.payload.commandTime)
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

  messageSent (author, chatText, commandTime) {
    this.messages = {
      author: new Author(author),
      chatText: new ChatText(chatText),
      time: new DateTime(commandTime)
    }
  }
}

module.exports = Message
```

### Read Model
**src/ReadModel/Messages.js**
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

### Wiring Things Together
**src/app.js**
```javascript
const bunyan = require('bunyan')
const { Runner } = require('ddd-js')
const Message = require('./Entities/Message') // see Root Entity
const Messages = require('./ReadModels/Messages') // see Read Model
const logger = bunyan.createLogger({ name: 'chat' })

Runner.createWithExpress(logger)
  .attachRootEntity(Message)
  .attachReadModel('/messages', Messages, 'messages')
  .replayHistory().then(runner => runner.startServer(8000))
```

### Usage
Run `node src/app.js` - There's your API! You can now `POST` commands to `http://localhost:8000/command` and `GET` messages from
`http://localhost:8000/messages`.

Example:
```http request
POST /command
Host: localhost:8000
Content-Type: application/json

{"name":"Message.sendMessage","time":"2019-12-08 16:06:37","payload":{"author":"Bob","chatText":"Hey, has anyone seen Jack recently!?"}}
```
