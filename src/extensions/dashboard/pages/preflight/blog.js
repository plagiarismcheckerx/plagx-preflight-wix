// Reads the site's published blog posts with the read-only "Read Blog" permission,
// as the signed-in Wix user. Nothing is written or stored.
import { posts } from '@wix/blog';
import { dashboard } from '@wix/dashboard';
import { createClient } from '@wix/sdk';
import { ricosToText } from './ricos.js';

/** Blog calls made as the signed-in Wix user, through the dashboard host. Created on first use. */
let client;
function blogApi() {
  client ??= createClient({ host: dashboard.host(), auth: dashboard.auth(), modules: { posts } });
  return client.posts;
}

/**
 * The 100 most recently published posts as { id, label } for the picker.
 * @returns {Promise<{ id: string, label: string }[]>}
 */
export async function listPosts(api = blogApi()) {
  const { items = [] } = await api.queryPosts().descending('firstPublishedDate').limit(100).find();
  return items.flatMap((p) => (p._id ? [{ id: p._id, label: p.title?.trim() || 'Untitled post' }] : []));
}

/** The plain text of one post. */
export async function readPost(id, api = blogApi()) {
  const { post } = await api.getPost(id, { fieldsets: ['RICH_CONTENT'] });
  return ricosToText(post?.richContent);
}
