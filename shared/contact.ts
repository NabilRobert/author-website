/**
 * A message sent through a site's contact form (ContactFormBlock.vue →
 * POST /api/sites/<name>/messages, server/contact-messages.ts), checked by
 * both. `website` is a trap: people never see the field, bots fill it in.
 */
import { z } from 'zod'

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, 'Add your name.').max(200, 'Keep your name under 200 characters.'),
  email: z.email('Enter your email address, like name@example.com, so they can reply.'),
  message: z.string().trim().min(1, 'Write your message.').max(5000, 'Keep the message under 5,000 characters.'),
  website: z.string().max(200).optional(),
})

export type ContactMessage = z.infer<typeof contactMessageSchema>
