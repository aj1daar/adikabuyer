/** Cut `text` to at most `max` characters, ending on a word boundary where it can,
 *  and append an ellipsis. Returns the text unchanged when it already fits. */
export default function truncate(text: string, max: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) {
    return trimmed
  }
  const slice = trimmed.slice(0, max)
  const lastSpace = slice.lastIndexOf(' ')
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice
  return `${cut.replace(/[\s.,;:!?-]+$/, '')}…`
}
