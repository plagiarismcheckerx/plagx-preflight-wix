// Reads the site's blog posts (drafts and published, through their draft copies) with the
// read-only "Read Draft Blog Posts" permission. Nothing is written or stored.
import { draftPosts } from '@wix/blog';
import { ricosToText } from './ricos.js';

const STATUS = { PUBLISHED: 'Published', UNPUBLISHED: 'Draft', SCHEDULED: 'Scheduled', IN_REVIEW: 'In review' };

/**
 * The 100 most recently edited posts as { id, label } for the picker.
 * @returns {Promise<{ id: string, label: string }[]>}
 */
export async function listPosts(api = draftPosts) {
  const { draftPosts: items = [] } = await api.listDraftPosts({ paging: { limit: 100 } });
  return items.flatMap((p) => {
    if (!p._id) return [];
    const status = STATUS[p.status];
    const title = p.title?.trim() || 'Untitled post';
    return [{ id: p._id, label: status ? `${title} (${status})` : title }];
  });
}

/** The plain text of one post. */
export async function readPost(id, api = draftPosts) {
  const { draftPost } = await api.getDraftPost(id, { fieldsets: ['RICH_CONTENT'] });
  return ricosToText(draftPost?.richContent);
}
