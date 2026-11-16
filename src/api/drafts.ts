// Draft blog posts for the dashboard page. Wix lets draft posts be read only with the
// app's own identity, so this Wix-hosted endpoint makes that call (read-only) after
// checking that the caller is a Wix user in the site's dashboard. Nothing is stored.
//   GET /drafts          -> { posts: [{ id, title, status }] }   (drafts and published posts' draft copies)
//   GET /drafts?id=<id>  -> { richContent }
import type { APIRoute } from '@wix/custom-extensions/types';
import { auth } from '@wix/essentials';
import { draftPosts } from '@wix/blog';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const listDrafts = auth.elevate(draftPosts.listDraftPosts);
const getDraft = auth.elevate(draftPosts.getDraftPost);
const queryDrafts = auth.elevate(draftPosts.queryDraftPosts);

export const GET: APIRoute = async ({ url }) => {
  const caller = await auth.getTokenInfo();
  if (caller.subjectType !== 'USER') return json({ error: 'Only site dashboard users can read drafts.' }, 403);

  const id = url.searchParams.get('id');
  if (id !== null) {
    if (!/^[A-Za-z0-9-]{1,38}$/.test(id)) return json({ error: 'Invalid post ID.' }, 400);
    // Get Draft Post first; Query Draft Posts (which also lists drafts) as the fallback.
    const errors: string[] = [];
    try {
      const { draftPost } = await getDraft(id, { fieldsets: ['RICH_CONTENT'] });
      if (draftPost?.richContent) return json({ richContent: draftPost.richContent });
      errors.push('get: no rich content');
    } catch (err) {
      errors.push(`get: ${(err as Error).message}`);
    }
    try {
      const { items = [] } = await queryDrafts({ fieldsets: ['RICH_CONTENT'] }).eq('_id', id).limit(1).find();
      if (items[0]?.richContent) return json({ richContent: items[0].richContent });
      errors.push(`query: ${items.length ? 'no rich content' : 'not found'}`);
    } catch (err) {
      errors.push(`query: ${(err as Error).message}`);
    }
    return json({ error: `Could not read this draft (${errors.join('; ')}).` }, 502);
  }

  // List Draft Posts first; if it comes back empty, Query Draft Posts as well.
  let items: { _id?: string | null; title?: string | null; status?: string | null }[] = [];
  try {
    const listed = await listDrafts({ paging: { limit: 100 } });
    items = listed.draftPosts ?? [];
  } catch {
    // Fall through to Query Draft Posts.
  }
  if (!items.length) {
    try {
      const queried = await queryDrafts().limit(100).find();
      items = queried.items ?? [];
    } catch (err) {
      return json({ error: `Could not list drafts: ${(err as Error).message}` }, 502);
    }
  }
  return json({ posts: items.map((p) => ({ id: p._id, title: p.title, status: p.status })) });
};
