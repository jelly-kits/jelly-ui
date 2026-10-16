# Jelly UI

[English](https://github.com/jelly-kits/jelly-ui/blob/main/README.en.md) | [简体中文](https://github.com/jelly-kits/jelly-ui/blob/main/README.md)

**Repository**: <https://github.com/jelly-kits/jelly-ui> | **uni-app repo**: <https://github.com/jelly-kits/jelly-ui-uniapp> | **Docs**: <https://jelly-kits.github.io/jelly-ui/> | **uni-app docs**: <https://jelly-kits.github.io/jelly-ui-uniapp/>

Vue 3 **Jelly** UI Component Library, plus a built-in documentation site. The design source is [`test.html`](https://github.com/jelly-kits/jelly-ui/blob/main/test.html) in the repo root (the spring / jelly motion prototype).

- **Zero runtime dependencies** (icons are built-in hand-drawn SVGs); `vue` is the only peer dependency. The rich-text editor sub-entry (`/editor`) additionally depends on tiptap and the drag-and-drop sorting sub-entry (`/sortable`) on sortablejs, whose packages are declared as **optional peers** and are only needed if you use them
- Scale: 117 component folders / 137 components / 111 documentation pages

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

## Rich-Text Editor (optional sub-entry)

`@jelly-kits/jelly-ui/editor` ships `JeEditor`, a lightweight rich-text editor: text formatting, H1 / H2 headings, bullet / ordered lists, hyperlinks, images, and video, without complex layouts such as text wrapping around images. It is built on [Tiptap](https://tiptap.dev/), and the related packages are declared as **optional peers** — install them only if you actually import the editor:

```bash
npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/core @tiptap/pm @tiptap/extension-image @tiptap/extensions
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { JeEditor, type JeEditorUpload } from '@jelly-kits/jelly-ui/editor'

const html = ref('<p>Hello</p>')

// Upload callback for images / video: return the final URL; onProgress drives the panel progress
const upload: JeEditorUpload = async (file, { onProgress }) => {
  onProgress(50)
  return 'https://cdn.example.com/uploaded.png'
}
</script>

<template>
  <je-editor v-model="html" :upload="upload" placeholder="Enter content…" />
</template>
```

- `v-model` carries an HTML string by default; set `value-type="json"` to carry a Tiptap document object instead.
- Without the `upload` callback, the image / video panels only offer a "type or paste a URL" field.
- The editor is **not exported from the main entry**, so projects that do not use it are never asked to install tiptap.
- For the remaining props (`disabled` / `minHeight` / `placeholder`), events, and exposed methods, see the Editor page in the [online docs](https://jelly-kits.github.io/jelly-ui/#/en-US/editor).

## Block Editor

`JeBlockEditor` breaks content into "blocks": one paragraph of text, one image, one video, and one hyperlink each take a block of their own, every block fills a row, and blocks can be dragged to reorder. The data is **plain JSON with no HTML**, so other platforms (mini-programs, native apps, …) can render it by branching on `type` — `JeBlockView` is the reference implementation for the display side. Both are exported from the main entry and add no extra dependencies.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { JeBlockEditor, JeBlockView, type JeBlockDocument, type JeBlockUpload } from '@jelly-kits/jelly-ui'

const doc = ref<JeBlockDocument>({
  version: 1,
  blocks: [{ id: 'b1', type: 'text', text: 'One paragraph is one block' }],
})

// Image / video upload: called once per file, returns a reachable URL; called for each file when picking several
const upload: JeBlockUpload = async (file) => 'https://cdn.example.com/uploaded.png'
</script>

<template>
  <je-block-editor v-model="doc" :upload="upload" />
  <je-block-view :value="doc" />
</template>
```

- Every block is just a preview until you **click it to select**; only then does its header show the icons (drag handle + edit / move up / move down / duplicate / remove). Click "Edit" — or simply **double-click the block** — to change it in a centered dialog; the data is written back only after you confirm.
- Without `upload` you can only type or paste a URL; with it, images can be picked several at a time — the first one fills the current block and each of the rest becomes a new image block right after it.
- Video blocks render only the poster plus a play button by default; the player is mounted and auto-plays only after you click play, so nothing is downloaded on page load.
- Images and videos support width (25% / 50% / 75% / 100% presets, or a custom value with `%` / `px`), height (leave it empty to keep the natural aspect ratio), and fit (mapped to `object-fit`: `contain` / `cover` / `fill`).
- `blockTypes` limits which block types can be added; `toolbar` and `blockActions` are "whitelist + order + custom buttons" and their callbacks receive the block and its index.
- For the remaining props, events, and exposed methods, see the BlockEditor page in the [online docs](https://jelly-kits.github.io/jelly-ui/#/en-US/block-editor).

## Drag-and-drop sorting (optional sub-entry)

`@jelly-kits/jelly-ui/sortable` provides `JeDragSort`: bind an array with `v-model` and you can reorder it by dragging, with multi-select group dragging and a mouse-following preview. It is built on [Sortable.js](https://github.com/SortableJS/Sortable), and `sortablejs` is declared as an **optional peer** — install it only if you actually import the component:

```bash
npm install sortablejs
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { JeDragSort } from '@jelly-kits/jelly-ui/sortable'

const items = ref([
  { id: 1, name: 'User Center' },
  { id: 2, name: 'Order Management' },
])
</script>

<template>
  <je-drag-sort v-model="items">
    <template #item="{ item }">{{ item.name }}</template>
  </je-drag-sort>
</template>
```

- `item-key` names the unique-key field (defaults to `id`); `handle` restricts dragging to a handle; `draggable` limits which children inside the container count as items.
- `target` points at a container already on the page (selector / element / ref) and the component then stops rendering its own list, wiring dragging directly onto that element.
- Clicking an item toggles multi-select (set `selectable` to false for single-item only), and dragging any selected item moves the whole group; selection changes are emitted through `update:selectedIds`.
- In the built-in mode the `item` slot customizes each card, while `itemMinWidth` and `height` control the card's minimum width and the list viewport height.
- The component is **not exported from the main entry**: projects that do not use it are never asked to install sortablejs.
- For the remaining props, events, and exposed methods, see the DragSort page in the [online docs](https://jelly-kits.github.io/jelly-ui/#/en-US/drag-sort).

## Local Development

```bash
npm install
npm run dev        # start the docs site (runs gen:api first)
```

| Command              | What it does                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `npm run dev`        | Start the docs site (`predev` runs `gen:api` automatically)                                                    |
| `npm run gen:api`    | Generate `demo/api-data.ts` from JSDoc in the component sources (**run this after changing a component**)      |
| `npm run typecheck`  | `vue-tsc --noEmit`                                                                                             |
| `npm run build`      | Build the library to `dist/` (`vite build` + type declarations)                                                |
| `npm run build:demo` | Build the docs site to `dist-demo/` (via `vite.config.demo.ts`; for sub-path deploys add `-- --base=/<repo>/`) |

## Project Layout

```
src/components/   Components (Je* prefix, je- CSS class names)
src/core/         Animation & overlay kernels (spring / useFloating / useZIndex / useFocusTrap …)
src/theme/        Global CSS tokens
src/editor.ts     Rich-text editor sub-entry (@jelly-kits/jelly-ui/editor)
src/sortable.ts   Drag-and-drop sorting sub-entry (@jelly-kits/jelly-ui/sortable)
demo/pages/       Documentation pages (111, 1:1 with routes)
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
