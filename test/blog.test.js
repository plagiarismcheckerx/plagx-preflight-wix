import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ricosToText } from '../src/extensions/dashboard/pages/preflight/ricos.js';
import { checkDraft } from '../src/lib/index.js';

// blog.js imports @wix/blog; give it a stand-in API instead so the test runs without Wix.
const { listPosts, readPost } = await import('../src/extensions/dashboard/pages/preflight/blog.js');

const text = (t) => ({ type: 'TEXT', textData: { text: t } });
const node = (type, nodes) => ({ type, nodes });

const POST = {
  nodes: [
    node('HEADING', [text('Introduction')]),
    node('PARAGRAPH', [text('Academic writing is is a skill '), text('(Smith, 2020)'), text('. Every source counts (Brown, 2018).')]),
    node('IMAGE', []),
    node('HEADING', [text('References')]),
    node('BULLETED_LIST', [
      node('LIST_ITEM', [node('PARAGRAPH', [text('Smith, J. (2020). Writing for university. Academic Press.')])]),
      node('LIST_ITEM', [node('PARAGRAPH', [text('Lee, K. (2019). Planning essays.')])]),
    ]),
  ],
};

test('Ricos content becomes paragraphs, headings marked, lists one item per line', () => {
  assert.equal(ricosToText(POST), [
    '# Introduction',
    'Academic writing is is a skill (Smith, 2020). Every source counts (Brown, 2018).',
    '# References',
    'Smith, J. (2020). Writing for university. Academic Press.',
    'Lee, K. (2019). Planning essays.',
  ].join('\n\n'));
});

test('line breaks and code blocks split into lines; empty content is empty', () => {
  const doc = { nodes: [node('PARAGRAPH', [text('One line\nTwo  line')]), node('CODE_BLOCK', [text('a = 1\n\nb = 2')]), node('PARAGRAPH', [])] };
  assert.equal(ricosToText(doc), 'One line\n\nTwo line\n\na = 1\n\nb = 2');
  assert.equal(ricosToText(null), '');
  assert.equal(ricosToText({}), '');
});

test('Preflight finds the issues in a post', () => {
  const codes = checkDraft(ricosToText(POST)).issues.map((i) => i.code);
  assert.ok(codes.includes('repeated-word'));
  assert.ok(codes.includes('citation-no-reference')); // Brown, 2018
  assert.ok(codes.includes('reference-not-cited')); // Lee, 2019
});

const publishedApi = (items, calls = []) => {
  const query = {
    descending: (f) => (calls.push(['sort', f]), query),
    limit: (n) => (calls.push(['limit', n]), query),
    find: async () => ({ items }),
  };
  return { queryPosts: () => query, getPost: async (id, opts) => (calls.push(['get', id, opts]), { post: { richContent: POST } }) };
};

test('drafts come from the endpoint; published posts not already listed are added', async () => {
  const calls = [];
  const api = {
    drafts: {
      list: async () => ({ posts: [{ id: 'a', title: 'Essay tips', status: 'PUBLISHED' }, { id: 'b', title: ' ', status: 'UNPUBLISHED' }, { title: 'No id' }] }),
      get: async (id) => (calls.push(['getDraft', id]), { richContent: POST }),
    },
    posts: publishedApi([{ _id: 'x', title: 'Essay tips' }, { _id: 'y', title: 'Live only' }], calls),
  };
  assert.deepEqual(await listPosts(api), [
    { id: 'a', kind: 'draft', label: 'Essay tips (Published)' },
    { id: 'b', kind: 'draft', label: 'Untitled post (Draft)' },
    { id: 'y', kind: 'post', label: 'Live only (Published)' },
  ]);
  assert.match(await readPost('a', 'draft', api), /^# Introduction/);
  assert.match(await readPost('y', 'post', api), /^# Introduction/);
  assert.deepEqual(calls, [['sort', 'firstPublishedDate'], ['limit', 100], ['getDraft', 'a'], ['get', 'y', { fieldsets: ['RICH_CONTENT'] }]]);
});

test('an empty or failing drafts list still shows published posts', async () => {
  const empty = { drafts: { list: async () => ({ posts: [] }) }, posts: publishedApi([{ _id: 'p', title: 'Live post' }]) };
  assert.deepEqual(await listPosts(empty), [{ id: 'p', kind: 'post', label: 'Live post (Published)' }]);
  const failing = { drafts: { list: async () => { throw new Error('Forbidden'); } }, posts: publishedApi([{ _id: 'p', title: 'Live post' }]) };
  assert.deepEqual(await listPosts(failing), [{ id: 'p', kind: 'post', label: 'Live post (Published)' }]);
});
