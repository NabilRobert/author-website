/**
 * Making page addresses from names. Shared by the editor (new pages and
 * works) and the server (giving works saved before work pages existed an
 * address when it reads them).
 */

/** "Tour Dates 2027!" → "tour-dates-2027"; accents are dropped ("Café" → "cafe"). */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** An address made from `title` that isn't taken yet: "about", then "about-2", "about-3"… */
export function uniqueSlug(title: string, takenSlugs: string[], fallback: string): string {
  const base = slugify(title) || fallback
  let slug = base
  for (let suffix = 2; takenSlugs.includes(slug); suffix++) slug = `${base}-${suffix}`
  return slug
}
