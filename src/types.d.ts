declare interface Event {
    uuid: string
    name: string
    time: string
    sagaId?: string
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
    lock(): void
    unlock(): void
    getLastProcessedEventUuid(): Promise<string>
}

declare interface Command {
    name: string
    time: string
    sagaId?: string
    payload: Object
}

declare interface CommandHandler {
    getAffectedEntities(command: Command): Promise<VersionableEntity[]>
    execute(command: Command): Promise<Event[]>
}

declare interface CommandDispatcher {
    subscribe(name: string, handler: CommandHandler, retries?: number): void
    dispatch(command: Command): Promise<void>
    lock(): void
    unlock(): void
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

declare interface RootEntityInterface {
    setup(): void
}

declare interface VersionableEntity {
    readonly version: Version
    versionUp(): void
}

declare interface Version {
    getNextVersion(): Version
    getValue(): number
    toString(): string
}

declare interface ReadModelInterface {
    setup(): void
}

declare interface SagaInterface {
    setup(): void
}
