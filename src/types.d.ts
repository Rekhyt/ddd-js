declare interface Event {
    name: string
    time: string
    payload
}

declare interface EventHandler {
    handle(event: Event): Event[]
}

declare interface EventDispatcher {
    subscribe(name: string, handler: EventHandler): void
    publish(event: Event): void
    publishMany(events: Event[]): void
    dispatch(event: Event): void
}

declare interface Command {
    name: string
    time: string
    payload
}

declare interface CommandHandler {
    handle(command: Command): Event[]
}
