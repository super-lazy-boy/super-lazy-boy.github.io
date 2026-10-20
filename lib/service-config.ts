import {z} from 'zod';

// Only a publishable key belongs in a public build. Owner rights come from the database.
export const serviceConfig=z.object({
  provider:z.literal('supabase'),
  url:z.string().url().regex(/^https:\/\/[a-z0-9]+\.supabase\.co$/),
  publishableKey:z.string().regex(/^sb_publishable_[A-Za-z0-9_-]+$/),
}).strict();
