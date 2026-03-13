import type { OptionValues } from "commander"
import { printCliError } from "./errors"

type AsyncCommandHandler<TOptions extends OptionValues = OptionValues> = (
  options: TOptions,
) => Promise<unknown> | unknown

export function runCommand<TOptions extends OptionValues>(
  handler: AsyncCommandHandler<TOptions>,
) {
  return async (options: TOptions) => {
    try {
      await handler(options)
    } catch (error) {
      printCliError(error)
      process.exitCode = 1
    }
  }
}
