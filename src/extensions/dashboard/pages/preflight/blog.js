// Lists and reads the site's blog posts, read-only. Drafts (and published posts, through
// their draft copies) come from the app's /drafts endpoint, since Wix only lets the app
// itself read drafts. If that is not available, published posts are read directly as the
// signed-in Wix user. Nothing is stored.
import { posts } from '@wix/blog';
import { dashboard } from '@wix/dashboard';
import { httpClient } from '@wix/essentials';
import { createClient } from '@wix/sdk';
import { ricosToText } from './ricos.js';

/** Why drafts could not be listed, if the published list was used instead. */
export let lastDraftError = '';

const STATUS = { PUBLISHED: 'Published', UNPUBLISHED: 'Draft', SCHEDULED: 'Scheduled', IN_REVIEW: 'In review' };
const title = (p) => p.title?.trim() || 'Untitled post';

/** The default API: the app's /drafts endpoint plus the published-posts SDK as the user. */
let defaultApi;
function blogApi() {
  if (defaultApi) return defaultApi;
  const client = createClient({ host: dashboard.host(), auth: dashboard.auth(), modules: { posts } });
  const endpoint = `${new URL(import.meta.url).origin}/drafts`;
  const call = async (query = '') => {
    const res = await httpClient.fetchWithAuth(`${endpoint}${query}`);
    const body = await res.text();
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      throw new Error(`Drafts request failed (${res.status}).`);
    }
    if (!res.ok) throw new Error(data.error || `Drafts request failed (${res.status}).`);
    if (!query && !Array.isArray(data.posts)) throw new Error('Unexpected drafts response.');
    return data;
  };
  defaultApi = {
    drafts: { list: () => call(), get: (id) => call(`?id=${encodeURIComponent(id)}`) },
    posts: client.posts,
  };
  return defaultApi;
}

/**
 * Up to 100 posts each of drafts (from the endpoint, with their status) and published posts,
 * as { id, kind, label } for the picker. A post listed as a draft copy is not repeated.
 * @returns {Promise<{ id: string, kind: 'draft' | 'post', label: string }[]>}
 */
export async function listPosts(api = blogApi()) {
  const [drafts, published] = await Promise.allSettled([
    api.drafts.list(),
    api.posts.queryPosts().descending('firstPublishedDate').limit(100).find(),
  ]);
  lastDraftError = drafts.status === 'rejected' ? (drafts.reason?.message ?? String(drafts.reason)) : '';
  if (drafts.status === 'rejected' && published.status === 'rejected') throw published.reason;

  const list = [];
  const seen = new Set();
  for (const p of drafts.status === 'fulfilled' ? drafts.value.posts ?? [] : []) {
    if (!p.id) continue;
    const status = STATUS[p.status];
    list.push({ id: p.id, kind: 'draft', label: status ? `${title(p)} (${status})` : title(p) });
    seen.add(title(p));
  }
  for (const p of published.status === 'fulfilled' ? published.value.items ?? [] : []) {
    if (!p._id || seen.has(title(p))) continue;
    list.push({ id: p._id, kind: 'post', label: `${title(p)} (Published)` });
  }
  return list;
}

/** The plain text of one post, from its draft copy or the published post. */
export async function readPost(id, kind, api = blogApi()) {
  if (kind === 'draft') {
    const { richContent } = await api.drafts.get(id);
    return ricosToText(richContent);
  }
  const { post } = await api.posts.getPost(id, { fieldsets: ['RICH_CONTENT'] });
  return ricosToText(post?.richContent);
}
