const validator = require('email-validator')

const StringValue = require('./StringValue')
const InvalidArgumentError = require('./Error/InvalidArgumentError')

class EmailAddress extends StringValue {
  constructor (value) {
    if (!validator.validate(value)) {
      throw new InvalidArgumentError(`Provided value is not a valid email address: ${value}`)
    }

    super(value)
  }
}

module.exports = EmailAddress
