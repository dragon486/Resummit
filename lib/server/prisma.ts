import 'server-only';
// @ts-ignore
import { prisma as db } from './db.js';

export const prisma = db;

/**
 * Robustly resolves the database User ID from a session.
 * Handles cases where session.user.id might be a provider ID (numeric)
 * by falling back to email-based lookup.
 */
export async function resolveUserId(session: any): Promise<string | null> {
  if (!session?.user) return null;
  const id = session.user.id;
  const email = session.user.email;

  // If it's already a CUID, return it
  if (id && id.startsWith('c')) return id;

  // Otherwise, look up by email
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    return user?.id || null;
  }

  return id?.startsWith('c') ? id : null;
}
