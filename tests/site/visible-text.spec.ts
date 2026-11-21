import { describe, expect, it } from 'vitest'
import { longText, requiredText, shortText } from '@shared/fields'

const RIGHT_TO_LEFT_OVERRIDE = '‮'
const ZERO_WIDTH_SPACE = '​'

describe('text fields on sites (shared/fields.ts)', () => {
  it('removes control and format characters from a line, like a right-to-left override', () => {
    expect(shortText.parse(`Mara ${RIGHT_TO_LEFT_OVERRIDE}ngised${ZERO_WIDTH_SPACE}\u0007`)).toBe('Mara ngised')
  })

  it('keeps the joiners that emoji and some scripts need', () => {
    expect(shortText.parse('Mara 👩‍💻')).toBe('Mara 👩‍💻')
    expect(shortText.parse('می‌خواهم')).toBe('می‌خواهم')
  })

  it('keeps line breaks and tabs in longer text, and removes the rest', () => {
    expect(longText.parse(`First line\n\tSecond${RIGHT_TO_LEFT_OVERRIDE} line\r`)).toBe('First line\n\tSecond line')
  })

  it.each([ZERO_WIDTH_SPACE, `${ZERO_WIDTH_SPACE}‍`, ' ́ '])('refuses a required name that would look blank', (name) => {
    const result = requiredText('Add your name.').safeParse(name)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Add your name.')
  })
})
