
# Headless Media SDK

An npm-workspaces TypeScript monorepo for a headless media SDK ecosystem built around the Pexels API.


## Workspace layout

- `packages/media-core` - Framework-agnostic SDK and data logic.
- `packages/media-react` - Thin React bindings for `media-core`.
- `packages/media-native` - Thin React Native bindings for `media-core`.
- `packages/media-ui-react` - Standalone headless React components.
- `packages/media-ui-native` - Standalone headless React Native components.
- `apps/web` - Web integration app.
- `sdk-docs` - SDK documentation.
- `components-docs` - UI component documentation.
- `skills` - Shared project guidance.
- `data-wiring` - Data integration notes.
- `ui-components` - UI planning and exploration.

## Commands

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Documentation

- SDK documentation: [`sdk-docs/index.html`](sdk-docs/index.html)
- Component documentation: [`components-docs/index.html`](components-docs/index.html)

Both documentation sites are static files. To preview the component docs locally:

```bash
python -m http.server 4175 --directory components-docs
```

Copy `.env.example` to `.env` when Pexels data wiring is implemented.

## AI-assisted development

AI coding tools were used for repository exploration, implementation, and review.
The two reusable skills in [`skills/data-wiring/SKILL.md`](skills/data-wiring/SKILL.md)
and [`skills/component-usage/SKILL.md`](skills/component-usage/SKILL.md) were used as
implementation checklists while wiring the web app. Their verification steps are
covered by the repository typecheck, build, and core test commands.

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
