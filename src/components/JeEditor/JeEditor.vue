<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
// 类型取 core 的那份：useEditor 回调里给的是 core Editor，vue-3 的 Editor 是它的子类，
// 工具函数的入参写成 core 的才能两种都收
import type { Editor } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import StarterKit from '@tiptap/starter-kit'
import JeIcon from '../JeIcon/JeIcon.vue'
import type { JeIconName } from '../JeIcon/icons'
import { useJeLocale } from '../JeLocale'
import { JeVideo } from './video'
import type {
  JeEditorButton,
  JeEditorButtonContext,
  JeEditorJSON,
  JeEditorToolKey,
  JeEditorToolbarItem,
  JeEditorUpload,
  JeEditorUploadFiles,
  JeEditorValue,
  JeEditorValueType,
} from './types'

defineOptions({ name: 'JeEditor' })

const props = withDefaults(
  defineProps<{
    /** 内容；html 格式是字符串，json 格式是文档对象，由 valueType 决定 */
    modelValue?: JeEditorValue
    /** v-model 的取值格式 */
    valueType?: JeEditorValueType
    /** 内容为空时的占位文案，缺省取语言包 editor.placeholder */
    placeholder?: string
    /** 禁用：只读且工具栏不可用 */
    disabled?: boolean
    /** 编辑区最小高度，数字按 px 处理 */
    minHeight?: number | string
    /**
     * 上传回调（图片 / 视频共用），不传则不显示面板里的「上传」按钮，只能填 / 粘地址。
     * 返回资源地址，编辑器插到当前光标处；图片多选时会被逐个调用。
     */
    upload?: JeEditorUpload
    /**
     * 批量上传回调：图片多选时优先走它（返回地址数组，顺序与入参一致），
     * 由宿主决定并发；不传则退化成逐个调用 upload。
     */
    uploadFiles?: JeEditorUploadFiles
    /**
     * 工具栏按钮的白名单：只列想显示的内置 key（`'bold'` / `'link'` / `'image'` …），
     * 数组顺序即展示顺序，`'divider'` 画一条分组竖线，也可以直接混入自定义按钮对象。
     * 不传时显示全部内置按钮。
     */
    toolbar?: JeEditorToolbarItem[]
  }>(),
  {
    modelValue: undefined,
    valueType: 'html',
    placeholder: undefined,
    disabled: false,
    minHeight: 240,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: JeEditorValue]
  /** 内容变化，与 update:modelValue 同值，便于 v-model 之外单独监听 */
  change: [value: JeEditorValue]
  focus: []
  blur: []
  /** 上传失败（回调抛错时派发）：单文件时数组里只有一个 */
  'upload-error': [files: File[], error: unknown]
}>()

const { t } = useJeLocale()

/**
 * 每次事务 +1，只为了让下面的 toolbarState 重算。
 * ProseMirror 的 isActive / can() 读的是编辑器内部状态，不是响应式的，
 * 不这样挂钩子的话，按钮的高亮与禁用不会跟着光标走。
 */
const version = ref(0)

const editor = useEditor({
  editable: !props.disabled,
  content: initialContent(),
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2] },
      // 编辑区里点链接不该跳走，要跳走的是渲染出来的 HTML
      link: { openOnClick: false, autolink: true, linkOnPaste: true },
    }),
    Image,
    JeVideo,
    Placeholder.configure({ placeholder: () => props.placeholder ?? t('editor.placeholder') }),
  ],
  onTransaction: () => {
    version.value += 1
  },
  onUpdate: ({ editor: instance }) => {
    const value = readValue(instance)
    emit('update:modelValue', value)
    emit('change', value)
  },
  onFocus: () => emit('focus'),
  onBlur: () => emit('blur'),
})

/** 首次内容：json 取值直接交给 Tiptap，html 取值由它自己解析 */
function initialContent(): string | JeEditorJSON | undefined {
  if (props.valueType === 'json') return (props.modelValue as JeEditorJSON | undefined) ?? undefined
  return (props.modelValue as string | undefined) ?? undefined
}

/** 按 valueType 从编辑器读出当前内容 */
function readValue(instance: Editor): JeEditorValue {
  return props.valueType === 'json' ? (instance.getJSON() as JeEditorJSON) : instance.getHTML()
}

/** 外部值和编辑器内部内容是否已经一致 */
function isSameAsEditor(instance: Editor, value: JeEditorValue | undefined): boolean {
  if (props.valueType === 'json') {
    return JSON.stringify(value ?? null) === JSON.stringify(instance.getJSON() ?? null)
  }
  return (value ?? '') === instance.getHTML()
}

watch(
  () => props.modelValue,
  (value) => {
    const instance = editor.value
    if (!instance) return
    // 与内部内容一致就不回写：否则自己派发的 update 会绕回来再 setContent 一次，光标会跳
    if (isSameAsEditor(instance, value)) return
    instance.commands.setContent((value ?? '') as JeEditorJSON | string, { emitUpdate: false })
  },
)

watch(
  () => props.disabled,
  (value) => {
    editor.value?.setEditable(!value)
  },
)

/** 工具栏各按钮的高亮 / 禁用状态 */
interface ToolbarState {
  heading1: boolean
  heading2: boolean
  paragraph: boolean
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  bulletList: boolean
  orderedList: boolean
  link: boolean
  canUndo: boolean
  canRedo: boolean
}

/** 编辑器还没挂载时的空状态，字段与真实计算保持一致 */
const EMPTY_TOOLBAR_STATE: ToolbarState = {
  heading1: false,
  heading2: false,
  paragraph: false,
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  bulletList: false,
  orderedList: false,
  link: false,
  canUndo: false,
  canRedo: false,
}

const toolbarState = computed<ToolbarState>(() => {
  // 读一下 version，把这次计算挂到「每次事务」上
  void version.value
  const instance = editor.value
  if (!instance) return EMPTY_TOOLBAR_STATE
  return {
    heading1: instance.isActive('heading', { level: 1 }),
    heading2: instance.isActive('heading', { level: 2 }),
    paragraph: instance.isActive('paragraph'),
    bold: instance.isActive('bold'),
    italic: instance.isActive('italic'),
    underline: instance.isActive('underline'),
    strike: instance.isActive('strike'),
    bulletList: instance.isActive('bulletList'),
    orderedList: instance.isActive('orderedList'),
    link: instance.isActive('link'),
    canUndo: instance.can().undo(),
    canRedo: instance.can().redo(),
  }
})

/** 焦点交回编辑区，并把选区还原到工具栏点击前的位置 */
const chain = () => editor.value?.chain().focus()

const toggleHeading = (level: 1 | 2) => chain()?.toggleHeading({ level }).run()
const setParagraph = () => chain()?.setParagraph().run()
const toggleBold = () => chain()?.toggleBold().run()
const toggleItalic = () => chain()?.toggleItalic().run()
const toggleUnderline = () => chain()?.toggleUnderline().run()
const toggleStrike = () => chain()?.toggleStrike().run()
const toggleBulletList = () => chain()?.toggleBulletList().run()
const toggleOrderedList = () => chain()?.toggleOrderedList().run()
const undo = () => chain()?.undo().run()
const redo = () => chain()?.redo().run()

/** 内置按钮的描述：文案、图标 / 文字、高亮与禁用怎么读、点下去执行什么 */
interface BuiltinTool {
  /** 语言包 key（已含 `editor.` 前缀），同时用作 title 与 aria-label */
  label: string
  /** 文字按钮：H1 / H2 是固定文字，正文要跟着语言切换，所以统一写成取值函数 */
  text?: () => string
  icon?: JeIconName
  active: (state: ToolbarState) => boolean
  disabled?: (state: ToolbarState) => boolean
  run: () => void
}

const builtinTools: Record<JeEditorToolKey, BuiltinTool> = {
  heading1: { label: 'editor.heading1', text: () => 'H1', active: (s) => s.heading1, run: () => toggleHeading(1) },
  heading2: { label: 'editor.heading2', text: () => 'H2', active: (s) => s.heading2, run: () => toggleHeading(2) },
  paragraph: {
    label: 'editor.paragraph',
    text: () => t('editor.paragraph'),
    active: (s) => s.paragraph,
    run: setParagraph,
  },
  bold: { label: 'editor.bold', icon: 'bold', active: (s) => s.bold, run: toggleBold },
  italic: { label: 'editor.italic', icon: 'italic', active: (s) => s.italic, run: toggleItalic },
  underline: { label: 'editor.underline', icon: 'underline', active: (s) => s.underline, run: toggleUnderline },
  strike: { label: 'editor.strike', icon: 'strike-through', active: (s) => s.strike, run: toggleStrike },
  bulletList: { label: 'editor.bulletList', icon: 'list', active: (s) => s.bulletList, run: toggleBulletList },
  orderedList: {
    label: 'editor.orderedList',
    icon: 'list-ordered',
    active: (s) => s.orderedList,
    run: toggleOrderedList,
  },
  link: { label: 'editor.link', icon: 'link', active: (s) => s.link, run: () => openPanel('link') },
  image: { label: 'editor.image', icon: 'image', active: () => false, run: () => openPanel('image') },
  video: { label: 'editor.video', icon: 'video', active: () => false, run: () => openPanel('video') },
  undo: { label: 'editor.undo', icon: 'undo', active: () => false, disabled: (s) => !s.canUndo, run: undo },
  redo: { label: 'editor.redo', icon: 'redo', active: () => false, disabled: (s) => !s.canRedo, run: redo },
}

/** 不传 toolbar 时的默认全套按钮，分组与顺序沿用原来的硬编码工具栏 */
const DEFAULT_TOOLBAR: JeEditorToolbarItem[] = [
  'heading1',
  'heading2',
  'paragraph',
  'divider',
  'bold',
  'italic',
  'underline',
  'strike',
  'divider',
  'bulletList',
  'orderedList',
  'divider',
  'link',
  'image',
  'video',
  'divider',
  'undo',
  'redo',
]

/** 模板只认这一种结构：内置按钮与自定义按钮在这里摊平 */
interface ToolbarItem {
  key: string
  /** 分组竖线，其余字段无意义 */
  divider?: boolean
  title: string
  icon?: JeIconName
  text?: string
  active: boolean
  disabled: boolean
  run: () => void
}

const toolbarItems = computed<ToolbarItem[]>(() => {
  // 先读一次状态：整段计算就挂到「每次事务」上了，自定义按钮的 isActive 也跟着一起重算
  const state = toolbarState.value
  const context: JeEditorButtonContext = {
    editor: editor.value,
    isActive: (name, attributes) => editor.value?.isActive(name, attributes) ?? false,
  }

  return (props.toolbar ?? DEFAULT_TOOLBAR).map((item, index): ToolbarItem => {
    if (item === 'divider') {
      return { key: `divider-${index}`, divider: true, title: '', active: false, disabled: false, run: () => {} }
    }
    if (typeof item === 'string') {
      const tool = builtinTools[item]
      return {
        key: item,
        title: t(tool.label),
        icon: tool.icon,
        text: tool.text?.(),
        active: tool.active(state),
        disabled: props.disabled || (tool.disabled?.(state) ?? false),
        run: tool.run,
      }
    }
    const button = item as JeEditorButton
    const buttonDisabled =
      typeof button.disabled === 'function' ? button.disabled(context) : button.disabled === true
    return {
      key: button.key,
      title: button.title,
      icon: button.icon,
      text: button.text,
      active: button.isActive?.(context) ?? false,
      disabled: props.disabled || buttonDisabled,
      run: () => button.onClick(context),
    }
  })
})

/* ---------------- 链接 / 图片 / 视频的输入面板 ---------------- */

type PanelMode = 'link' | 'image' | 'video'

const panel = ref<PanelMode | null>(null)
const panelUrl = ref('')
const panelInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
/** 整体上传进度（0-100） */
const progress = ref(0)
/** 正在传第几个（从 0 起）与总个数，用来把进度显示成「2/5 60%」 */
const fileIndex = ref(0)
const fileTotal = ref(0)

const panelTitle = computed(() => (panel.value ? t(`editor.${panel.value}`) : ''))

const panelPlaceholder = computed(() => {
  if (panel.value === 'link') return t('editor.linkUrl')
  if (panel.value === 'image') return t('editor.imageUrl')
  return t('editor.videoUrl')
})

const uploadAccept = computed(() => (panel.value === 'video' ? 'video/*' : 'image/*'))

/** 只有图片支持一次选多个：视频进编辑器是一整块，多选意义不大 */
const uploadMultiple = computed(() => panel.value === 'image')

/** 上传入口只服务图片 / 视频：链接面板只有「填地址」 */
const uploadable = computed(() => panel.value === 'image' || panel.value === 'video')

/** 上传按钮上的文案：多图时带上「第几个 / 共几个」 */
const uploadLabel = computed(() => {
  if (!uploading.value) return t('editor.upload')
  const count = fileTotal.value > 1 ? `${fileIndex.value + 1}/${fileTotal.value} ` : ''
  return `${count}${progress.value}%`
})

const minHeightStyle = computed(() =>
  typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight,
)

const openPanel = (mode: PanelMode) => {
  const instance = editor.value
  if (!instance || props.disabled) return
  // 光标正落在链接上时带出原地址，方便改
  panelUrl.value = mode === 'link' ? (instance.getAttributes('link').href ?? '') : ''
  panel.value = mode
  nextTick(() => panelInput.value?.focus())
}

const closePanel = () => {
  panel.value = null
  panelUrl.value = ''
  uploading.value = false
  progress.value = 0
  fileIndex.value = 0
  fileTotal.value = 0
  chain()?.run()
}

/** 没写协议的地址补 https://，否则会被浏览器当成相对路径 */
const withScheme = (value: string) => (/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`)

const confirmPanel = () => {
  const instance = editor.value
  const mode = panel.value
  if (!instance || !mode || uploading.value) return
  const value = panelUrl.value.trim()

  if (mode === 'link') {
    // 先把选区扩到整条链接上，再决定是设置还是取消（清空输入即取消链接）
    const link = instance.chain().focus().extendMarkRange('link')
    if (value) link.setLink({ href: withScheme(value) }).run()
    else link.unsetLink().run()
    closePanel()
    return
  }

  if (!value) return
  if (mode === 'image') instance.chain().focus().setImage({ src: value }).run()
  else instance.chain().focus().setVideo({ src: value }).run()
  closePanel()
}

const triggerUpload = () => fileInput.value?.click()

/** 把上传得到的地址插到光标处；多张图片一次性插入，落在同一段里 */
const insertResources = (mode: 'image' | 'video', urls: string[]) => {
  const instance = editor.value
  if (!instance || !urls.length) return
  const type = mode === 'image' ? 'image' : 'jeVideo'
  instance
    .chain()
    .focus()
    .insertContent(urls.map((src) => ({ type, attrs: { src } })))
    .run()
}

/** 没传 uploadFiles 时的退路：逐个调用单文件回调（串行，避免把宿主的接口打爆） */
const uploadEach = async (files: File[], upload: JeEditorUpload): Promise<string[]> => {
  const urls: string[] = []
  for (let index = 0; index < files.length; index += 1) {
    fileIndex.value = index
    urls.push(
      await upload(files[index], {
        onProgress: (percent) => {
          // 已完成 index 个，加上当前这个的百分比，折算成整体进度
          progress.value = Math.round(((index + percent / 100) / files.length) * 100)
        },
      }),
    )
  }
  return urls
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  // 清掉 value，否则连续两次选同一个文件不会再触发 change
  input.value = ''
  const mode = panel.value
  const uploadFiles = props.uploadFiles
  const upload = props.upload
  // 上传只服务图片 / 视频面板（链接面板没有上传入口），这里顺带把模式收窄成两者之一
  if (!files.length || (mode !== 'image' && mode !== 'video') || (!uploadFiles && !upload)) return

  uploading.value = true
  progress.value = 0
  fileIndex.value = 0
  fileTotal.value = files.length
  try {
    const urls = uploadFiles
      ? await uploadFiles(files, {
          onProgress: (percent) => {
            progress.value = percent
          },
          onFileProgress: (index, percent) => {
            fileIndex.value = index
            progress.value = Math.round(((index + percent / 100) / files.length) * 100)
          },
        })
      : await uploadEach(files, upload as JeEditorUpload)
    // 全部成功才插入：中途失败就整批不落进正文，避免留下半截内容
    insertResources(mode, urls)
    closePanel()
  } catch (error) {
    emit('upload-error', files, error)
  } finally {
    uploading.value = false
  }
}

defineExpose({
  /** Tiptap 编辑器实例，需要更细的控制时用（挂载完成前是 undefined） */
  editor,
  /** 取当前内容的 HTML */
  getHTML: () => editor.value?.getHTML() ?? '',
  /** 取当前内容的 JSON */
  getJSON: () => (editor.value?.getJSON() as JeEditorJSON | undefined) ?? null,
  /** 清空内容（会派发一次内容变化） */
  clear: () => editor.value?.commands.clearContent(true),
  /** 聚焦编辑区 */
  focus: () => chain()?.run(),
})
</script>

<template>
  <div
    class="je-editor"
    :class="{ 'is-disabled': disabled }"
    :style="{ '--je-editor-min-height': minHeightStyle }"
  >
    <!--
      工具栏全部由 toolbarItems 派生：内置按钮写 key、自定义按钮写对象、'divider' 画竖线，
      所以「显示哪些按钮、什么顺序」与「加自己的按钮」走的是同一条路。
    -->
    <div class="je-editor__toolbar">
      <template v-for="item in toolbarItems" :key="item.key">
        <span v-if="item.divider" class="je-editor__divider" />
        <button
          v-else
          type="button"
          class="je-editor__btn"
          :class="{ 'is-active': item.active, 'je-editor__btn--text': item.text }"
          :title="item.title"
          :aria-label="item.title"
          :aria-pressed="item.active"
          :disabled="item.disabled"
          @click="item.run()"
        >
          <template v-if="item.text">{{ item.text }}</template>
          <JeIcon v-else-if="item.icon" :name="item.icon" :size="16" />
        </button>
      </template>
    </div>

    <div v-if="panel" class="je-editor__panel">
      <span class="je-editor__panel-title">{{ panelTitle }}</span>
      <input
        ref="panelInput"
        v-model="panelUrl"
        class="je-editor__input"
        type="text"
        :placeholder="panelPlaceholder"
        :disabled="uploading"
        @keyup.enter="confirmPanel"
        @keyup.esc="closePanel"
      />
      <button
        v-if="uploadable && (upload || uploadFiles)"
        type="button"
        class="je-editor__panel-btn"
        :disabled="uploading"
        @click="triggerUpload"
      >
        {{ uploadLabel }}
      </button>
      <button
        type="button"
        class="je-editor__panel-btn je-editor__panel-btn--primary"
        :disabled="uploading"
        @click="confirmPanel"
      >
        {{ t('confirm') }}
      </button>
      <button type="button" class="je-editor__panel-btn" :disabled="uploading" @click="closePanel">
        {{ t('cancel') }}
      </button>
    </div>

    <EditorContent class="je-editor__content" :editor="editor" />

    <input
      ref="fileInput"
      class="je-editor__file"
      type="file"
      :accept="uploadAccept"
      :multiple="uploadMultiple"
      @change="onFileChange"
    />

    <div v-if="$slots.footer" class="je-editor__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.je-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  font-family: inherit;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  overflow: hidden;
}

.je-editor.is-disabled {
  opacity: 0.6;
}

.je-editor__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  background: var(--je-popup);
  border-bottom: var(--je-border);
}

.je-editor__divider {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: var(--je-border-color);
}

.je-editor__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  font: inherit;
  color: var(--je-text-muted);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--je-control-radius);
  transition: color var(--je-duration), background var(--je-duration);
}

.je-editor__btn--text {
  font-size: 13px;
  font-weight: 600;
}

.je-editor__btn:hover:not(:disabled) {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-editor__btn.is-active {
  color: var(--je-primary);
  background: var(--je-surface-hover);
}

.je-editor__btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.je-editor__panel {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  background: var(--je-popup);
  border-bottom: var(--je-border);
}

.je-editor__panel-title {
  flex: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--je-text-muted);
}

.je-editor__input {
  flex: 1;
  min-width: 0;
  height: var(--je-control-h);
  padding: 0 var(--je-control-px);
  font: inherit;
  font-size: var(--je-control-fs);
  color: var(--je-text);
  background: transparent;
  border: var(--je-border);
  border-radius: var(--je-control-radius);
  outline: none;
}

.je-editor__input:focus {
  border-color: var(--je-primary);
}

.je-editor__panel-btn {
  flex: none;
  height: var(--je-control-h);
  padding: 0 var(--je-control-px);
  font: inherit;
  font-size: var(--je-control-fs);
  color: var(--je-text);
  cursor: pointer;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-control-radius);
  transition: filter var(--je-duration);
}

.je-editor__panel-btn:hover:not(:disabled) {
  filter: brightness(0.97);
}

.je-editor__panel-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.je-editor__panel-btn--primary {
  color: var(--je-text-on-color);
  background: var(--je-primary);
  border-color: transparent;
}

.je-editor__file {
  display: none;
}

/* 编辑区由 Tiptap 自己在里面再挂一层 .ProseMirror，选择器必须穿透 scoped */
.je-editor__content :deep(.ProseMirror) {
  box-sizing: border-box;
  min-height: var(--je-editor-min-height, 240px);
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--je-text);
  outline: none;
}

.je-editor__content :deep(.ProseMirror > * + *) {
  margin-top: 0.75em;
}

.je-editor__content :deep(.ProseMirror p),
.je-editor__content :deep(.ProseMirror h1),
.je-editor__content :deep(.ProseMirror h2),
.je-editor__content :deep(.ProseMirror ul),
.je-editor__content :deep(.ProseMirror ol),
.je-editor__content :deep(.ProseMirror blockquote),
.je-editor__content :deep(.ProseMirror pre) {
  margin: 0;
}

.je-editor__content :deep(.ProseMirror h1) {
  font-size: 1.5em;
  line-height: 1.35;
}

.je-editor__content :deep(.ProseMirror h2) {
  font-size: 1.25em;
  line-height: 1.4;
}

.je-editor__content :deep(.ProseMirror ul),
.je-editor__content :deep(.ProseMirror ol) {
  padding-left: 1.5em;
}

.je-editor__content :deep(.ProseMirror blockquote) {
  padding-left: 12px;
  color: var(--je-text-muted);
  border-left: 3px solid var(--je-border-color);
}

.je-editor__content :deep(.ProseMirror code) {
  padding: 1px 5px;
  font-size: 0.9em;
  background: var(--je-surface);
  border-radius: 4px;
}

.je-editor__content :deep(.ProseMirror pre) {
  padding: 10px 12px;
  overflow: auto;
  background: var(--je-surface);
  border-radius: var(--je-control-radius);
}

.je-editor__content :deep(.ProseMirror pre code) {
  padding: 0;
  background: none;
}

.je-editor__content :deep(.ProseMirror hr) {
  border: 0;
  border-top: var(--je-border);
}

.je-editor__content :deep(.ProseMirror a) {
  color: var(--je-primary);
  cursor: pointer;
  text-decoration: underline;
}

.je-editor__content :deep(.ProseMirror img),
.je-editor__content :deep(.ProseMirror video) {
  max-width: 100%;
  height: auto;
  border-radius: var(--je-radius-sm);
}

.je-editor__content :deep(.ProseMirror video) {
  display: block;
}

/* 占位文案由 Placeholder 扩展写在节点属性上，只能用 ::before 取出来 */
.je-editor__content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  float: left;
  height: 0;
  color: var(--je-text-faint);
  pointer-events: none;
  content: attr(data-placeholder);
}

.je-editor__footer {
  padding: 8px 12px;
  border-top: var(--je-border);
}
</style>
