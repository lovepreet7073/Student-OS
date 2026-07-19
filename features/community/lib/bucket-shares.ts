import type { MyShareItem } from "../actions/list-my-shares";
import type { CommunityNoteStatus } from "../types";

/**
 * Buckets a list of MyShareItems by status so the profile UI can render each
 * group under its own header.
 *
 * Lives outside `actions/` because Next.js's `"use server"` files may only
 * export async functions — this synchronous helper travelled with
 * `listMyShares` in dev but broke the production Webpack build.
 */
export function bucketByStatus(
  items: MyShareItem[],
): Record<CommunityNoteStatus, MyShareItem[]> {
  const buckets: Record<CommunityNoteStatus, MyShareItem[]> = {
    pending: [],
    approved: [],
    rejected: [],
  };
  for (const item of items) buckets[item.status].push(item);
  return buckets;
}
