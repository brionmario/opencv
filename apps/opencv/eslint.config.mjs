// Flat config. eslint-config-next ships its own flat exports from v16, so
// there is no FlatCompat shim here.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

const config = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'next-env.d.ts',
      // Vendored shadcn/ui primitives. They are upstream's code, kept close
      // to upstream so they can be re-pulled; linting them to this project's
      // taste would make every update a merge.
      'components/ui/**',
    ],
  },

  ...nextCoreWebVitals,
  ...nextTypeScript,

  {
    rules: {
      // next/image optimises at request time through the Next server. This
      // app is `output: 'export'` with `images: { unoptimized: true }`, so it
      // would add a wrapper and a layout pass and optimise nothing. The
      // résumé templates have a second reason: they are rendered to PDF and
      // to standalone HTML, neither of which can carry a framework component.
      '@next/next/no-img-element': 'off',
      // The convention this repo already writes: an underscore marks an
      // argument kept for its position or a binding kept for documentation.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    // Every one of these reads browser-only state on mount: the saved theme,
    // the stored documents, a résumé in the URL fragment. The page is
    // prerendered at build time (`output: 'export'`), so none of it can be
    // known until the component is on a real client, and setting it from an
    // effect is the only place it can happen. The rule cannot tell that case
    // from a render cascade, and it reports at whichever setState happens to
    // come first in the effect, so a line-level disable does not stay put.
    // The rule stays on everywhere else, where it is worth having.
    files: [
      'app/templates/page.tsx',
      'app/view/page.tsx',
      'components/dashboard/index.tsx',
      'components/cv-builder/index.tsx',
      'hooks/use-cv-data.ts',
    ],
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },

  {
    // @react-pdf/renderer's <Image> is a PDF drawing primitive, not an <img>:
    // there is no accessibility tree in a PDF page and the component takes no
    // alt prop.
    files: ['lib/pdf-*.tsx'],
    rules: { 'jsx-a11y/alt-text': 'off' },
  },
]

export default config
