export interface CliErrorOptions {
  details?: string[]
  cause?: unknown
}

export class CliError extends Error {
  readonly details: string[]

  constructor(message: string, options: CliErrorOptions = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = "CliError"
    this.details = options.details ?? []
  }
}

export function printCliError(error: unknown): void {
  if (error instanceof CliError) {
    console.error(`\n❌ ${error.message}`)

    for (const detail of error.details) {
      console.error(`   → ${detail}`)
    }

    console.error("")
    return
  }

  if (error instanceof Error) {
    console.error(`\n❌ ${error.message}\n`)
    return
  }

  console.error(`\n❌ ${String(error)}\n`)
}
