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
    publish(event: Event, save?: boolean): Promise<void>
    publishMany(events: Event[], save?: boolean): Promise<void>
    replayAll(): Promise<void>
}

declare interface Command {
    name: string
    time: string
    payload: Object
}

declare interface CommandHandler {
    execute(command: Command): Promise<Event[]>
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

declare interface EventStore {
    save(event: Event): Promise<string>
    get(eventId: string): Promise<Event>
    getAll (): Promise<Event[]>
    getDateRange(from: string, to?: string): Promise<Event[]>
}

declare interface InvalidValidationField {
    fieldName: string
    message: string
}
