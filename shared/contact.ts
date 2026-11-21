/**
 * A message sent through a site's contact form (ContactFormBlock.vue →
 * POST /api/sites/<name>/messages, server/contact-messages.ts), checked by
 * both. `website` is a trap: people never see the field, bots fill it in.
 */
import { z } from 'zod'
import { blockOfText, HAS_VISIBLE_CHARACTER, lineOfText } from './fields'

export const contactMessageSchema = z.object({
  // The name goes into the owner's email subject (server/email.ts), so invisible characters are removed.
  name: lineOfText().regex(HAS_VISIBLE_CHARACTER, 'Add your name.').max(200, 'Keep your name under 200 characters.'),
  email: z.email('Enter your email address, like name@example.com, so they can reply.'),
  message: blockOfText()
    .regex(HAS_VISIBLE_CHARACTER, 'Write your message.')
    .max(5000, 'Keep the message under 5,000 characters.'),
  website: z.string().max(200).optional(),
})

export type ContactMessage = z.infer<typeof contactMessageSchema>
