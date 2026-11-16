// Wix Blog stores posts as Ricos rich content (a JSON tree). This turns it into the
// paragraph text Plagx Preflight expects: one paragraph per block (and per line inside
// a block), with headings marked "# " so a References heading starts the reference list.

/** Blocks whose text forms one paragraph; containers (lists, quotes, tables) hold these. */
const LEAVES = new Set(['PARAGRAPH', 'HEADING', 'CODE_BLOCK']);

/** All the text inside a node, in order. */
function textOf(node) {
  if (node.type === 'TEXT') return node.textData?.text ?? '';
  return (node.nodes ?? []).map(textOf).join('');
}

const lines = (text) => text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

function blocks(node, out) {
  if (LEAVES.has(node.type)) {
    if (node.type === 'HEADING') {
      const text = textOf(node).replace(/\s+/g, ' ').trim();
      if (text) out.push(`# ${text}`);
    } else {
      out.push(...lines(textOf(node)));
    }
    return out;
  }
  for (const child of node.nodes ?? []) blocks(child, out);
  return out;
}

/** Ricos rich content (`{ nodes: [...] }`) as plain paragraphs separated by blank lines. */
export function ricosToText(richContent) {
  if (!richContent?.nodes) return '';
  return blocks({ nodes: richContent.nodes }, []).join('\n\n');
}
