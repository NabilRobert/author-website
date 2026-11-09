/** Text helpers shared by the site and the server (link previews). */

/** Splits text on blank lines, the way the owner types paragraphs. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}
