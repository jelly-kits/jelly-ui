// 富文本编辑器的独立入口（`@jelly-kits/jelly-ui/editor`）。
//
// 刻意不从 src/index.ts 导出：编辑器依赖 @tiptap/*，而那些包记为「可选 peer」——
// 一旦进了主入口，没用到编辑器的用户也会被要求安装 tiptap。
// 独立成入口后，只有真的 import 了本模块的人才需要装它们（见 vite.config.ts 的 external）。
export { JeEditor } from './components/JeEditor'
export type {
  JeEditorButton,
  JeEditorButtonContext,
  JeEditorJSON,
  JeEditorToolKey,
  JeEditorToolbarItem,
  JeEditorUpload,
  JeEditorUploadFiles,
  JeEditorUploadFilesOptions,
  JeEditorUploadOptions,
  JeEditorValue,
  JeEditorValueType,
} from './components/JeEditor'
