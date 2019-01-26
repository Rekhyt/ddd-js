declare interface Event {
    name: string
    time: string
    payload: Object
}

declare interface EventHandler {
    apply(event: Event): Promise<void>
}

declare interface EventDispatcher {
    subscribe(name: string, handler: EventHandler): void
    publish(event: Event, save): Promise<void>
    publishMany(events: Event[], save): Promise<void>
}

declare interface Command {
    name: string
    time: string
    payload: Object
}

declare interface CommandHandler {
    handle(command: Command): Event[]
}

declare interface CommandDispatcher {
    subscribe(name: string, handler: CommandHandler): void
    dispatch(command: Command): Promise<void>
}

declare interface Logger {
    trace(...args)
    debug(...args)
    info(...args)
    warn(...args)
    error(...args)
}

declare interface EventRepository {
    save(event: Event): Promise<string>
    get(eventId: string): Promise<Event>
    getDateRange(from: string, to: string|undefined): Promise<Event[]>
}
