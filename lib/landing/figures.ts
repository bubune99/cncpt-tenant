/** How a marketing figure is written (en-US, fixed decimals). Pure; check: figures.assert.ts. */
export function formatFigure(value: number, decimals: number): string {
  return Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(value.toFixed(decimals)))
}
