declare interface Event {
    name: string
    time: string
    payload
}

declare interface EventHandler {
    apply(event: Event): Event[]
}

declare interface EventDispatcher {
    subscribe(name: string, handler: EventHandler): void
    publish(event: Event): Promise<void>
    publishMany(events: Event[]): Promise<void>
    dispatch(event: Event): Promise<void>
}

declare interface Command {
    name: string
    time: string
    payload
}

declare interface CommandHandler {
    handle(command: Command): Event[]
}

declare interface CommandDispatcher {
    subscribe(name: string, handler: CommandHandler): void
    dispatch(command: Command): Event[]
}

declare interface Logger {
    trace(...args)
    debug(...args)
    info(...args)
    warn(...args)
    error(...args)
}