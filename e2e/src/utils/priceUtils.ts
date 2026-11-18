/** Parse a displayed price such as "LKR 3,990.00" into a number (3990). */
export function parsePrice(text: string): number {
  const match = text.replace(/,/g, '').match(/\d+(\.\d+)?/);
  if (!match) {
    throw new Error(`Unable to parse price from "${text}"`);
  }
  return Number.parseFloat(match[0]);
}

/** Format a number the way the shop displays it: 3990 -> "LKR 3,990.00". */
export function formatPrice(value: number): string {
  return `LKR ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
