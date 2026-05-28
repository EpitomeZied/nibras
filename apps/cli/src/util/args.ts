/**
 * Shared argument-parsing utilities for CLI commands.
 * Centralised here to avoid copy-paste across every command file.
 */

/**
 * Returns the value that follows `name` in `args`, or null if not found.
 * Example: parseOption(['--api-base-url', 'http://localhost:4848'], '--api-base-url')
 *          → 'http://localhost:4848'
 */
export function parseOption(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] || null;
}

/**
 * Returns true when `flag` appears anywhere in `args`.
 * Example: hasFlag(['--no-open', '--force'], '--force') → true
 */
export function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

export function stripFlags(args: string[], flags: string[]): string[] {
  const blocked = new Set(flags);
  return args.filter((arg) => !blocked.has(arg));
}

export function requireNoUnknownFlags(
  args: string[],
  allowed: string[],
  commandLabel: string
): void {
  const allowedSet = new Set(allowed);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('-')) continue;
    if (allowedSet.has(arg)) {
      if (arg.startsWith('--') && !['--help', '-h'].includes(arg) && index + 1 < args.length) {
        const next = args[index + 1];
        if (!next.startsWith('-')) {
          index += 1;
        }
      }
      continue;
    }
    throw new Error(`Unknown flag "${arg}" for ${commandLabel}. Run \`nibras ${commandLabel} --help\`.`);
  }
}
