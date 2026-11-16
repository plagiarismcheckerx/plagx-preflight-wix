import { useEffect, useState, type FC } from 'react';
import {
  AutoComplete, Badge, Box, Button, Card, Cell, Checkbox, Dropdown, FormField, InputArea, Layout, Loader,
  NumberInput, Page, RadioGroup, SectionHelper, Text, TextButton, WixDesignSystemProvider,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { checkDraft, type Result } from '../../../../lib/index.js';
import { lastDraftError, listPosts, readPost } from './blog.js';

type Source = 'post' | 'paste';
type Style = 'apa' | 'mla';

const CHECKS = [
  { value: 'length', label: 'Length and structure', on: true },
  { value: 'references', label: 'Citations and reference list', on: true },
  { value: 'punctuation', label: 'Punctuation', on: true },
  { value: 'grammar', label: 'Basic grammar', on: true },
  { value: 'passive-voice', label: 'Passive voice', on: false },
];
const LEVELS = { error: 'Error', warning: 'Warning', info: 'Suggestion' } as const;
const SKINS = { error: 'danger', warning: 'warning', info: 'standard' } as const;
const CREDIT_URL = 'https://plagiarismcheckerx.com/?utm_source=plagx-preflight-wix';

/** "1 warning", "2 warnings". */
const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** The level is shown as a badge, so drop the "Suggestion: " prefix and capitalise what is left. */
const plain = (msg: string) => {
  const text = msg.replace(/^Suggestion: /, '');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Pasted text: each non-empty line is its own paragraph. */
const pasted = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean).join('\n\n');

const Stat: FC<{ value: number; label: string }> = ({ value, label }) => (
  <Box direction="vertical" padding="SP2 SP3" borderRadius="8px" backgroundColor="B50">
    <Text size="medium" weight="bold">{String(value)}</Text>
    <Text size="small" secondary>{label}</Text>
  </Box>
);

const Results: FC<{ result: Result }> = ({ result }) => {
  const { stats } = result;
  return (
    <Box direction="vertical" gap="SP3">
      <Layout cols={4} gap="12px">
        <Cell span={1}><Stat value={stats.words} label="Words" /></Cell>
        <Cell span={1}><Stat value={stats.readingTimeMinutes} label="Min read" /></Cell>
        <Cell span={1}><Stat value={stats.sentences} label="Sentences" /></Cell>
        <Cell span={1}><Stat value={stats.paragraphs} label="Paragraphs" /></Cell>
      </Layout>
      <Box gap="SP2">
        <Badge size="small" skin={result.errors ? 'danger' : 'neutralLight'}>{count(result.errors, 'error')}</Badge>
        <Badge size="small" skin={result.warnings ? 'warning' : 'neutralLight'}>{count(result.warnings, 'warning')}</Badge>
        <Badge size="small" skin={result.infos ? 'standard' : 'neutralLight'}>{count(result.infos, 'suggestion')}</Badge>
      </Box>
      {result.issues.length === 0 ? (
        <SectionHelper appearance="success">✓ No issues found.</SectionHelper>
      ) : (
        <Box direction="vertical" gap="SP2">
          {result.issues.map((issue, i) => (
            <Box key={i} direction="vertical" gap="SP1" padding="SP2 SP3" border="1px solid #dfe5eb" borderRadius="8px">
              <Box><Badge size="tiny" skin={SKINS[issue.level]}>{LEVELS[issue.level]}</Badge></Box>
              <Text size="small" weight="normal">{plain(issue.message)}</Text>
              {issue.text ? (
                <Text size="tiny" secondary>{issue.text.length > 120 ? `${issue.text.slice(0, 120)}…` : issue.text}</Text>
              ) : null}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

const PreflightPage: FC = () => {
  const [source, setSource] = useState<Source>('post');
  const [posts, setPosts] = useState<{ id: string; kind: 'draft' | 'post'; label: string }[] | null>(null);
  const [postId, setPostId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [text, setText] = useState('');
  const [minWords, setMinWords] = useState<number | null>(null);
  const [maxWords, setMaxWords] = useState<number | null>(null);
  const [style, setStyle] = useState<Style>('apa');
  const [checks, setChecks] = useState(() => CHECKS.filter((c) => c.on).map((c) => c.value));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    listPosts()
      .then((items) => {
        setPosts(items);
        if (lastDraftError) setNotice({ text: `Drafts could not be loaded, so only published posts are listed: ${lastDraftError}` });
        if (items[0]) {
          setPostId(items[0].id);
          setSearch(items[0].label);
        }
      })
      .catch((err: Error) => {
        setPosts([]);
        setNotice({ text: `Could not load blog posts: ${err.message}`, error: true });
      });
  }, []);

  const toggle = (value: string) =>
    setChecks((list) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]));

  async function run() {
    setBusy(true);
    setNotice(null);
    setResult(null);
    try {
      let draft = '';
      if (source === 'paste') draft = pasted(text);
      else if (!postId) {
        setNotice({ text: 'Choose a blog post from the list to check.' });
        return;
      } else draft = await readPost(postId, posts?.find((p) => p.id === postId)?.kind ?? 'draft');
      if (!draft) {
        setNotice({ text: 'No text found to check.' });
        return;
      }
      setResult(checkDraft(draft, { minWords: minWords || undefined, maxWords: maxWords || undefined, style, checks }));
    } catch (err) {
      setNotice({ text: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  const postPicker = posts === null ? (
    <Loader size="tiny" />
  ) : posts.length === 0 ? (
    <Text size="small" secondary>No blog posts yet. Write a post in Wix Blog, or use Pasted text.</Text>
  ) : (
    <AutoComplete
      options={posts.map((p) => ({ id: p.id, value: p.label }))}
      value={search}
      placeholder="Search or choose a post"
      onChange={(e) => {
        setSearch(e.target.value);
        setPostId('');
      }}
      onSelect={(option) => {
        setPostId(String(option.id));
        setSearch(String(option.value));
      }}
      predicate={(option) => {
        const typed = search.trim().toLowerCase();
        // Show every post when nothing is typed or a post is already chosen.
        if (!typed || postId) return true;
        return String(option.value).toLowerCase().includes(typed);
      }}
      emptyStateMessage="No posts match your search."
    />
  );

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="Plagx Draft Preflight"
          subtitle="Check a blog post before you publish: length, citations, punctuation and basic grammar."
        />
        <Page.Content>
          <Layout>
            <Cell span={5}>
              <Card>
                <Card.Header title="What to check" />
                <Card.Divider />
                <Card.Content>
                  <Box direction="vertical" gap="SP4">
                    <FormField label="Source">
                      <RadioGroup value={source} onChange={(v) => setSource(v as Source)} display="horizontal">
                        <RadioGroup.Radio value="post">Blog post</RadioGroup.Radio>
                        <RadioGroup.Radio value="paste">Pasted text</RadioGroup.Radio>
                      </RadioGroup>
                    </FormField>
                    {source === 'post' ? (
                      <FormField label="Blog post">{postPicker}</FormField>
                    ) : (
                      <FormField label="Text">
                        <InputArea
                          rows={8}
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Paste a draft here. Put a References heading before your reference list."
                        />
                      </FormField>
                    )}
                    <Layout cols={2} gap="12px">
                      <Cell span={1}>
                        <FormField label="Min words">
                          <NumberInput value={minWords ?? undefined} min={0} onChange={(v) => setMinWords(v)} placeholder="0" />
                        </FormField>
                      </Cell>
                      <Cell span={1}>
                        <FormField label="Max words">
                          <NumberInput value={maxWords ?? undefined} min={0} onChange={(v) => setMaxWords(v)} placeholder="0" />
                        </FormField>
                      </Cell>
                    </Layout>
                    <FormField label="Citation style">
                      <Dropdown
                        options={[{ id: 'apa', value: 'APA' }, { id: 'mla', value: 'MLA' }]}
                        selectedId={style}
                        onSelect={(option) => setStyle(option.id as Style)}
                      />
                    </FormField>
                    <FormField label="Checks">
                      <Box direction="vertical" gap="SP2">
                        {CHECKS.map((c) => (
                          <Checkbox key={c.value} checked={checks.includes(c.value)} onChange={() => toggle(c.value)}>
                            {c.label}
                          </Checkbox>
                        ))}
                      </Box>
                    </FormField>
                    <Button onClick={run} disabled={busy} fullWidth>
                      {busy ? 'Checking…' : 'Check draft'}
                    </Button>
                  </Box>
                </Card.Content>
              </Card>
            </Cell>
            <Cell span={7}>
              <Card>
                <Card.Header title="Results" />
                <Card.Divider />
                <Card.Content>
                  {notice ? (
                    <SectionHelper appearance={notice.error ? 'danger' : 'standard'}>{notice.text}</SectionHelper>
                  ) : result ? (
                    <Results result={result} />
                  ) : (
                    <Text size="small" secondary>Choose a blog post or paste text, then click Check draft.</Text>
                  )}
                </Card.Content>
              </Card>
            </Cell>
            <Cell span={12}>
              <Box direction="vertical" gap="SP1">
                <Text size="tiny" secondary>
                  Automated suggestions only. Your text is checked in your browser; it is never stored or sent to Plagiarism Checker X.
                </Text>
                <Text size="tiny" secondary>
                  Made by Plagiarism Checker X. For full plagiarism checking and AI-text detection, visit{' '}
                  <TextButton as="a" size="tiny" href={CREDIT_URL} target="_blank" rel="noopener">Text Similarity Detector</TextButton>.
                </Text>
              </Box>
            </Cell>
          </Layout>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default PreflightPage;
