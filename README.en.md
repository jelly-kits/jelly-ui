# Jelly UI

[English](https://github.com/jelly-kits/jelly-ui/blob/main/README.en.md) | [简体中文](https://github.com/jelly-kits/jelly-ui/blob/main/README.md)

**Repository**: <https://github.com/jelly-kits/jelly-ui> | **Docs**: <https://jelly-kits.github.io/jelly-ui/>

A **prototype** Vue 3 component library with a jelly-like, springy feel, plus a built-in documentation site. The design source is [`test.html`](https://github.com/jelly-kits/jelly-ui/blob/main/test.html) in the repo root (the spring / jelly motion prototype).

- **Zero runtime dependencies** (icons are built-in hand-drawn SVGs); `vue` is the only peer dependency
- Scale: 113 component folders / 134 exported components / 108 documentation pages

## Install & Usage

```bash
npm install @jelly-kits/jelly-ui
```

**Styles live in a separate file and must be imported once explicitly** (the library does not inject them):

```ts
// main.ts
import '@jelly-kits/jelly-ui/style.css'
```

**Named imports (recommended)** — components are named exports: import them in PascalCase from the script, use kebab-case tags in the template:

```vue
<script setup lang="ts">
import { JeButton } from '@jelly-kits/jelly-ui'
</script>

<template>
  <je-button type="primary">Jelly Button</je-button>
</template>
```

**Full import** — install every component at once via the Vue plugin, then just use `<je-*>` tags in templates without importing each one:

```ts
// main.ts
import { createApp } from 'vue'
import JellyUI from '@jelly-kits/jelly-ui'
import '@jelly-kits/jelly-ui/style.css'
import App from './App.vue'

createApp(App).use(JellyUI).mount('#app')
```

- A full import pulls the whole library into the dependency graph, so the bundler **can no longer tree-shake** unused components; prefer named imports when bundle size matters. The plugin is also available as a named export: `import { JellyUI } from '@jelly-kits/jelly-ui'`.
- `vue@^3.5` is the only peer dependency (components use `useId` / `useTemplateRef`).
- `style.css` holds both the component styles and the global CSS tokens (`--je-*`); override the tokens to re-theme.
- The ESM build declares `sideEffects` (CSS only), so unused components can be tree-shaken away.
- For the imperative APIs (`showMessage` / `showDialog` / `showLoading`) and everything else, see the [online docs](https://jelly-kits.github.io/jelly-ui/) (sources live in [`demo/pages/`](https://github.com/jelly-kits/jelly-ui/tree/main/demo/pages); run `npm run dev` locally).

## Local Development

```bash
npm install
npm run dev        # start the docs site (runs gen:api first)
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the docs site (`predev` runs `gen:api` automatically) |
| `npm run gen:api` | Generate `demo/api-data.ts` from JSDoc in the component sources (**run this after changing a component**) |
| `npm run typecheck` | `vue-tsc --noEmit` |
| `npm run build` | Build the library to `dist/` (`vite build` + type declarations) |
| `npm run build:demo` | Build the docs site to `dist-demo/` (via `vite.config.demo.ts`; for sub-path deploys add `-- --base=/<repo>/`) |

## Project Layout

```
src/components/   Components (Je* prefix, je- CSS class names)
src/core/         Animation & overlay kernels (spring / useFloating / useZIndex / useFocusTrap …)
src/theme/        Global CSS tokens
demo/pages/       Documentation pages (108, 1:1 with routes)
scripts/          gen-api.mjs (API table generation), api-glossary.mjs (fallback glossary)
.github/workflows/  deploy-demo.yml — pushes to main auto-publish the docs site to GitHub Pages
test.html         Design-source prototype, read-only reference
```

## Acknowledgements

The **API design and interaction patterns** here take cues from two excellent open-source projects. **The source code is an independent implementation — no code or assets were copied from them — and this project is not affiliated with either.**

- [Element Plus](https://element-plus.org/en-US) — desktop component semantics
  (MIT License, Copyright (c) 2020-PRESENT Element Plus)
- [Vant](https://vant-ui.github.io/vant/#/en-US) — mobile interaction patterns
  (MIT License, Copyright (c) Youzan / Chen Jiahan and other contributors)

Both are open-sourced under the MIT License, which permits free use, modification and redistribution (redistributing their code requires keeping their copyright notice). This project only aligns its naming and interaction conventions with them; nothing under `src/` contains their code or assets.
