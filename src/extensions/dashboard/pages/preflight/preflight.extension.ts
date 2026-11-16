import { extensions } from '@wix/custom-extensions';

export default extensions.dashboardPage({
  id: '3afff47e-832c-4613-8629-0d3c7d64fef5',
  title: 'Plagx Draft Preflight',
  routePath: '',
  component: './extensions/dashboard/pages/preflight/preflight.tsx',
  fullPage: false,
  metaData: {
    searchable: true,
    description: 'Check a blog post for length, citations, punctuation and basic grammar before you publish.',
  },
});
