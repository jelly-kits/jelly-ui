<script setup lang="ts">
/*
 * 块编辑器：一段文本 / 一张图片 / 一个视频 / 一条超链接各占一块，
 * 每块宽度占满、可拖动排序，数据是一份不含 HTML 的纯 JSON（JeBlockDocument）。
 *
 * 交互口径：
 * - 列表里每个块都只是「预览」，点一下选中（出现高亮边框），未选中时不显示任何图标；
 * - 选中后才显示块头部的图标：拖动把手 + 编辑 / 上移 / 下移 / 复制 / 删除，
 *   点「编辑」才弹出这个块真正的编辑窗口（居中弹窗，改完点确定才落数据）；
 * - 双击块也能直接打开它的编辑窗口，等价于点头部那个「编辑」；
 * - 从顶部操作栏添加新块时，自动选中并直接打开它的编辑窗口。
 *
 * 与 JeEditor（富文本）的分工：这里刻意不做行内富文本与图文环绕，
 * 换来的是小程序等其他端拿同一份 JSON 就能按 type 分支渲染（参考 JeBlockView）。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import JeButton from '../JeButton/JeButton.vue'
import JeDialog from '../JeDialog/JeDialog.vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import type { JeIconName } from '../JeIcon/icons'
import { useJeLocale } from '../JeLocale'
import { JE_BLOCK_VERSION } from './types'
import type {
  JeBlock,
  JeBlockActionItem,
  JeBlockActionKey,
  JeBlockButton,
  JeBlockButtonContext,
  JeBlockDocument,
  JeBlockFit,
  JeBlockImage,
  JeBlockInput,
  JeBlockInsertKey,
  JeBlockLengthUnit,
  JeBlockPatch,
  JeBlockToolbarItem,
  JeBlockType,
  JeBlockUpload,
  JeBlockWidthPreset,
} from './types'

defineOptions({ name: 'JeBlockEditor' })

const props = withDefaults(
  defineProps<{
    /** 完整数据，v-model 绑定 */
    modelValue?: JeBlockDocument
    /** 允许添加的块类型白名单，不传则四种都能加 */
    blockTypes?: JeBlockType[]
    /**
     * 顶部操作栏：内置「添加块」按钮写块类型 key（同时就是白名单与顺序），
     * `'divider'` 画分组竖线，也可以直接混入自定义按钮对象。不传则四种块都可加。
     */
    toolbar?: JeBlockToolbarItem[]
    /**
     * 每块头部的操作按钮：内置 key 是 `'drag' | 'edit' | 'up' | 'down' | 'copy' | 'remove'`，
     * 同样支持 `'divider'` 与自定义按钮对象。不传即全部六个。
     */
    blockActions?: JeBlockActionItem[]
    /** 文本块的占位文案 */
    placeholder?: string
    /** 图片 / 视频上传回调，不传则编辑窗口里只能填地址 */
    upload?: JeBlockUpload
    disabled?: boolean
  }>(),
  {
    modelValue: undefined,
    blockTypes: undefined,
    toolbar: undefined,
    blockActions: undefined,
    placeholder: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: JeBlockDocument]
  /** 数据变化，与 update:modelValue 同值，便于 v-model 之外单独监听 */
  change: [value: JeBlockDocument]
  /** 上传失败（回调抛错时派发） */
  'upload-error': [file: File, error: unknown]
}>()

const { t } = useJeLocale()

/** 默认顶部操作栏：四种块各一个按钮 */
const DEFAULT_TOOLBAR: JeBlockToolbarItem[] = ['text', 'image', 'video', 'link']
/** 默认块头部：把手 + 编辑 / 上移 / 下移 / 复制 / 删除 */
const DEFAULT_ACTIONS: JeBlockActionItem[] = ['drag', 'edit', 'up', 'down', 'copy', 'remove']

const ALL_TYPES: JeBlockType[] = ['text', 'image', 'video', 'link']
/** 编辑窗口里的宽度档位 */
const WIDTH_PRESETS: JeBlockWidthPreset[] = ['25%', '50%', '75%', '100%']
/** 编辑窗口里的缩放方式 */
const FIT_OPTIONS: JeBlockFit[] = ['contain', 'cover', 'fill']
/** 长度输入框的单位切换候选项 */
const UNIT_OPTIONS: JeBlockLengthUnit[] = ['%', 'px']

/** 新块的 id：时间戳 + 自增，够用且不依赖 crypto */
let seed = 0
const createId = () => `blk_${Date.now().toString(36)}${(seed += 1).toString(36)}`

const clone = (blocks: JeBlock[]): JeBlock[] => blocks.map((block) => ({ ...block }))

const localBlocks = ref<JeBlock[]>(clone(props.modelValue?.blocks ?? []))

const buildDocument = (): JeBlockDocument => ({
  // 版本号沿用外部传进来的，方便宿主自己升版本
  version: props.modelValue?.version ?? JE_BLOCK_VERSION,
  blocks: clone(localBlocks.value),
})

const commit = () => {
  const document = buildDocument()
  emit('update:modelValue', document)
  emit('change', document)
}

watch(
  () => props.modelValue,
  (value) => {
    const incoming = value?.blocks ?? []
    // 自己刚 emit 出去的值会绕回来，内容一致就整段跳过，
    // 否则每次输入都会重建整个列表，光标与拖动态都会被打断
    if (JSON.stringify(incoming) === JSON.stringify(localBlocks.value)) return
    localBlocks.value = clone(incoming)
    // 外部换了一整份数据，之前选中 / 正在编辑 / 正在播放的块可能已经不存在了
    if (!localBlocks.value.some((block) => block.id === selectedId.value)) selectedId.value = ''
    if (!localBlocks.value.some((block) => block.id === playingId.value)) playingId.value = ''
    if (!localBlocks.value.some((block) => block.id === editingId.value)) closeEditor()
  },
  { deep: true },
)

/* -------------------- 选中态 -------------------- */

/** 当前选中的块，空串表示没选中；只有选中的块才显示头部图标 */
const selectedId = ref('')

const selectBlock = (id: string) => {
  if (props.disabled || dragIndex.value >= 0) return
  // 已被删掉的块（点删除时事件会冒泡上来）不再回填选中
  if (id && !localBlocks.value.some((block) => block.id === id)) return
  selectedId.value = id
}

/**
 * 双击块打开它的编辑窗口。
 * 播放器与播放键上的双击不算「双击块」：双击播放键时第一下就已经把封面换成播放器了，
 * 第二下会落在播放器上冒泡上来，这里挡掉，免得顺手把编辑窗口也带出来。
 */
const onBlockDblClick = (id: string, event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (target?.closest('video, .je-block-editor__play')) return
  openEditor(id)
}

/* -------------------- 视频播放 -------------------- */

/**
 * 正在播放的视频块，空串表示都还停在封面上。
 * 视频默认不挂载播放器（只渲染封面 + 播放键），点了才挂载，免得一进页面就拉视频流量。
 */
const playingId = ref('')

const playVideo = (id: string) => {
  playingId.value = id
}

/* -------------------- 增删改 -------------------- */

const createBlock = (type: JeBlockType): JeBlock => {
  const id = createId()
  if (type === 'text') return { id, type, text: '' }
  if (type === 'image') return { id, type, url: '' }
  if (type === 'video') return { id, type, url: '' }
  return { id, type, url: '', title: '' }
}

/** 插入一个块，返回它的 id（外部可以不传 id，这里补上） */
const insertBlock = (input: JeBlockInput, at?: number): string => {
  if (props.disabled) return ''
  const id = input.id ?? createId()
  const block: JeBlock = { ...input, id } as JeBlock
  localBlocks.value.splice(at ?? localBlocks.value.length, 0, block)
  commit()
  return id
}

/** 按类型追加一个空块 */
const addBlock = (type: JeBlockType): string => insertBlock(createBlock(type))

/** 把空的字符串字段收成 undefined，免得存库的 JSON 里全是空串 */
const compact = (value: string) => (value === '' ? undefined : value)

const patchBlock = (id: string, patch: JeBlockPatch) => {
  const target = localBlocks.value.find((block) => block.id === id)
  if (!target) return
  Object.assign(target, patch)
  commit()
}

const removeBlock = (id: string) => {
  const index = localBlocks.value.findIndex((block) => block.id === id)
  if (index < 0) return
  localBlocks.value.splice(index, 1)
  if (selectedId.value === id) selectedId.value = ''
  if (playingId.value === id) playingId.value = ''
  if (editingId.value === id) closeEditor()
  commit()
}

const copyBlock = (id: string) => {
  const index = localBlocks.value.findIndex((block) => block.id === id)
  if (index < 0) return
  const copyId = insertBlock({ ...localBlocks.value[index], id: createId() }, index + 1)
  selectedId.value = copyId
}

/** 把 from 处的块挪到 to 处（to 是插入目标下标，允许等于列表长度） */
const moveBlock = (from: number, to: number) => {
  const blocks = localBlocks.value
  if (from < 0 || from >= blocks.length) return
  const target = Math.max(0, Math.min(to, blocks.length))
  if (target === from || target === from + 1) return
  const [moved] = blocks.splice(from, 1)
  blocks.splice(target > from ? target - 1 : target, 0, moved)
  commit()
}

const clear = () => {
  localBlocks.value = []
  selectedId.value = ''
  playingId.value = ''
  closeEditor()
  commit()
}

/* -------------------- 拖动排序 -------------------- */

const listEl = ref<HTMLElement | null>(null)
/** 正在被拖动的块下标，-1 表示没在拖 */
const dragIndex = ref(-1)
/** 松手后会插入到的位置（0..块数），与 dragIndex 同时用于画指示线 */
const dropIndex = ref(-1)

const onPointerMove = (event: PointerEvent) => {
  const list = listEl.value
  if (!list || dragIndex.value < 0) return
  const items = Array.from(list.children) as HTMLElement[]
  // 指针越过某块的中线，就认为要插到它前面；都没越过则插到末尾
  let target = items.length
  for (let index = 0; index < items.length; index += 1) {
    const rect = items[index].getBoundingClientRect()
    if (event.clientY < rect.top + rect.height / 2) {
      target = index
      break
    }
  }
  dropIndex.value = target
}

/** 摘掉拖动期间的全局监听 */
const detachDrag = () => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}

const stopDrag = () => {
  detachDrag()
  const from = dragIndex.value
  const to = dropIndex.value
  if (from >= 0 && to >= 0) moveBlock(from, to)
  dragIndex.value = -1
  dropIndex.value = -1
}

const startDrag = (index: number, event: PointerEvent) => {
  if (props.disabled) return
  // 阻止默认行为，免得拖动把手时把块内的文字选中了
  event.preventDefault()
  dragIndex.value = index
  dropIndex.value = index
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}

// 组件卸载时只摘监听，不再落位（此时数据已经没意义了）
onBeforeUnmount(detachDrag)

/* -------------------- 编辑窗口 -------------------- */

/** 编辑窗口里改的是这份草稿，点确定才写回列表 */
interface DraftState {
  id: string
  type: JeBlockType
  text: string
  url: string
  alt: string
  poster: string
  title: string
  /** CSS 宽度值，空串表示占满 */
  width: string
  /** CSS 高度值，空串表示自适应 */
  height: string
  fit: JeBlockFit
}

const dialogVisible = ref(false)
const draft = ref<DraftState | null>(null)
/** 正在编辑哪个块，关闭弹窗后清空 */
const editingId = ref('')

/** 模板里统一读这份（草稿为空时给个空壳），省掉一层层可能为空的判断 */
const EMPTY_DRAFT: DraftState = {
  id: '',
  type: 'text',
  text: '',
  url: '',
  alt: '',
  poster: '',
  title: '',
  width: '',
  height: '',
  fit: 'contain',
}
const form = computed<DraftState>(() => draft.value ?? EMPTY_DRAFT)

/** 宽高输入框的数值与单位：与 draft.width / draft.height 双向同步 */
const widthNumber = ref('')
const widthUnit = ref<JeBlockLengthUnit>('%')
const heightNumber = ref('')
const heightUnit = ref<JeBlockLengthUnit>('px')

/** 把 '360px' / '50%' 拆成数值与单位；不是长度值时返回空数值 + 兜底单位 */
const parseLength = (value: string | undefined, fallback: JeBlockLengthUnit) => {
  const matched = /^(\d+(?:\.\d+)?)(px|%)$/.exec(value ?? '')
  if (!matched) return { number: '', unit: fallback }
  return { number: matched[1], unit: matched[2] as JeBlockLengthUnit }
}

const syncSizeInputs = (width?: string, height?: string) => {
  const parsedWidth = parseLength(width, '%')
  widthNumber.value = parsedWidth.number
  widthUnit.value = parsedWidth.unit
  const parsedHeight = parseLength(height, 'px')
  heightNumber.value = parsedHeight.number
  heightUnit.value = parsedHeight.unit
}

const toDraft = (block: JeBlock): DraftState => ({
  id: block.id,
  type: block.type,
  text: block.type === 'text' ? block.text : '',
  url: block.type === 'text' ? '' : block.url,
  alt: block.type === 'image' ? block.alt ?? '' : '',
  poster: block.type === 'video' ? block.poster ?? '' : '',
  title: block.type === 'link' ? block.title ?? '' : '',
  width: block.type === 'image' || block.type === 'video' ? block.width ?? '' : '',
  height: block.type === 'image' || block.type === 'video' ? block.height ?? '' : '',
  fit: (block.type === 'image' || block.type === 'video' ? block.fit : undefined) ?? 'contain',
})

const openEditor = (id: string) => {
  if (props.disabled) return
  const block = localBlocks.value.find((item) => item.id === id)
  if (!block) return
  selectedId.value = id
  editingId.value = id
  draft.value = toDraft(block)
  syncSizeInputs(draft.value.width, draft.value.height)
  dialogVisible.value = true
}

const closeEditor = () => {
  dialogVisible.value = false
}

/** 关闭动画跑完再清草稿，否则收起过程中表单会突然变空 */
const onDialogClosed = () => {
  draft.value = null
  editingId.value = ''
}

const dialogTitle = computed(() => {
  const type = draft.value?.type
  if (!type) return ''
  return t('block.editTitle', { type: t(`block.${type}`) })
})

/** 草稿里的宽高变化要同时回写「数值 + 单位」两个输入框 */
const setWidthPreset = (preset: JeBlockWidthPreset) => {
  if (!draft.value) return
  draft.value.width = preset
  widthNumber.value = preset.replace('%', '')
  widthUnit.value = '%'
}

const onWidthNumber = (value: string) => {
  const number = value.replace(/[^\d.]/g, '')
  widthNumber.value = number
  if (draft.value) draft.value.width = number ? `${number}${widthUnit.value}` : ''
}

const onWidthUnit = (unit: JeBlockLengthUnit) => {
  widthUnit.value = unit
  if (draft.value) draft.value.width = widthNumber.value ? `${widthNumber.value}${unit}` : ''
}

const onHeightNumber = (value: string) => {
  const number = value.replace(/[^\d.]/g, '')
  heightNumber.value = number
  if (draft.value) draft.value.height = number ? `${number}${heightUnit.value}` : ''
}

const onHeightUnit = (unit: JeBlockLengthUnit) => {
  heightUnit.value = unit
  if (draft.value) draft.value.height = heightNumber.value ? `${heightNumber.value}${unit}` : ''
}

/** 把草稿按类型摊成补丁；close 传 false 时保留弹窗（多图上传要接着再插几个块） */
const applyDraft = (close = true) => {
  const value = draft.value
  if (!value) return
  const patch: JeBlockPatch =
    value.type === 'text'
      ? { text: value.text }
      : value.type === 'link'
        ? { url: value.url.trim(), title: compact(value.title) }
        : {
            url: value.url.trim(),
            width: compact(value.width),
            height: compact(value.height),
            // contain 是默认值，不写进 JSON，数据里更干净
            fit: value.fit === 'contain' ? undefined : value.fit,
            ...(value.type === 'image'
              ? { alt: compact(value.alt) }
              : { poster: compact(value.poster) }),
          }
  patchBlock(value.id, patch)
  // 地址或封面可能变了，回到封面态重新渲染
  if (playingId.value === value.id) playingId.value = ''
  if (close) closeEditor()
}

/* -------------------- 上传 -------------------- */

const fileInput = ref<HTMLInputElement | null>(null)
/** 正在上传，用来禁用编辑窗口里的按钮 */
const uploading = ref(false)
const uploadAccept = ref('image/*')
/** 图片允许多选（一次选 N 张会落成 N 个图片块），视频只能单选 */
const uploadMultiple = ref(false)
/** 点上传时先记下要传什么，change 事件里再用 */
let uploadTarget: JeBlockType = 'image'

const pickFile = async (type: JeBlockType) => {
  uploadTarget = type
  uploadAccept.value = type === 'video' ? 'video/*' : 'image/*'
  uploadMultiple.value = type === 'image'
  // multiple 属性要先落到 DOM 上，再点才生效
  await nextTick()
  fileInput.value?.click()
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  // 清掉 value，否则连续两次选同一个文件不会再触发 change
  input.value = ''
  const upload = props.upload
  const value = draft.value
  if (!files.length || !upload || !value) return

  uploading.value = true
  const urls: string[] = []
  try {
    // 串行上传：地址顺序与选择顺序一致，多图落地时不会错位
    for (const file of files) {
      urls.push(await upload(file))
    }
  } catch (error) {
    emit('upload-error', files[urls.length] ?? files[0], error)
    uploading.value = false
    return
  }
  uploading.value = false

  value.url = urls[0]
  if (uploadTarget === 'video' || urls.length === 1) return

  // 多图：当前块留下第一张，其余各生成一个图片块插在它后面
  const index = localBlocks.value.findIndex((block) => block.id === value.id)
  applyDraft(false)
  if (index < 0) {
    closeEditor()
    return
  }
  const extras: JeBlockImage[] = urls.slice(1).map((url) => ({
    id: createId(),
    type: 'image',
    url,
    width: compact(value.width),
    height: compact(value.height),
    fit: value.fit === 'contain' ? undefined : value.fit,
  }))
  localBlocks.value.splice(index + 1, 0, ...extras)
  commit()
  closeEditor()
}

/* -------------------- 顶部操作栏与块头部 -------------------- */

/** 模板只认这一种结构：内置按钮与自定义按钮在 resolveItems 里摊平 */
interface RenderItem {
  key: string
  /** 分组竖线，其余字段无意义 */
  divider?: boolean
  /** 内置 key（自定义按钮没有），把手靠它识别 */
  builtin?: string
  title: string
  icon?: JeIconName
  text?: string
  active: boolean
  disabled: boolean
  run: () => void
  /** 渲染成拖动把手（按下即拖动） */
  handle?: boolean
}

interface BuiltinSpec {
  /** 语言包 key（已含 `block.` 前缀） */
  label: string
  icon?: JeIconName
  run: (context: JeBlockButtonContext) => void
  active?: (context: JeBlockButtonContext) => boolean
  disabled?: (context: JeBlockButtonContext) => boolean
}

const contextOf = (block: JeBlock | undefined, index: number): JeBlockButtonContext => ({
  block,
  index,
  insert: insertBlock,
  update: patchBlock,
  remove: removeBlock,
  move: moveBlock,
  openEditor,
})

const insertTools: Record<JeBlockInsertKey, BuiltinSpec> = {
  // 添加完直接打开编辑窗口，接着就能填内容
  text: { label: 'block.text', icon: 'text', run: () => openEditor(addBlock('text')) },
  image: { label: 'block.image', icon: 'image', run: () => openEditor(addBlock('image')) },
  video: { label: 'block.video', icon: 'video', run: () => openEditor(addBlock('video')) },
  link: { label: 'block.link', icon: 'link', run: () => openEditor(addBlock('link')) },
}

const actionTools: Record<JeBlockActionKey, BuiltinSpec> = {
  // 把手由模板单独渲染（要接 pointerdown 而不是 click），这里只提供文案
  drag: { label: 'block.drag', icon: 'drag', run: () => {} },
  edit: {
    label: 'block.edit',
    icon: 'edit',
    run: (context) => context.block && openEditor(context.block.id),
  },
  up: {
    label: 'block.up',
    icon: 'arrow-up',
    disabled: (context) => context.index <= 0,
    run: (context) => moveBlock(context.index, context.index - 1),
  },
  down: {
    label: 'block.down',
    icon: 'arrow-down',
    disabled: (context) => context.index >= localBlocks.value.length - 1,
    run: (context) => moveBlock(context.index, context.index + 2),
  },
  copy: {
    label: 'block.copy',
    icon: 'copy',
    run: (context) => context.block && copyBlock(context.block.id),
  },
  remove: {
    label: 'block.remove',
    icon: 'trash',
    run: (context) => context.block && removeBlock(context.block.id),
  },
}

/** 内置项里不在白名单里的块类型直接跳过（只对顶部操作栏有意义） */
const allowInsert = (key: string) =>
  !props.blockTypes || !ALL_TYPES.includes(key as JeBlockType) || props.blockTypes.includes(key as JeBlockType)

const resolveItems = (
  list: (JeBlockToolbarItem | JeBlockActionItem)[],
  builtins: Record<string, BuiltinSpec>,
  context: JeBlockButtonContext,
  filterAllowed: boolean,
): RenderItem[] =>
  list.flatMap((item, index): RenderItem[] => {
    if (item === 'divider') {
      return [{ key: `divider-${index}`, divider: true, title: '', active: false, disabled: false, run: () => {} }]
    }
    if (typeof item === 'string') {
      if (filterAllowed && !allowInsert(item)) return []
      const spec = builtins[item]
      return [
        {
          key: item,
          builtin: item,
          title: t(spec.label),
          icon: spec.icon,
          active: spec.active?.(context) ?? false,
          disabled: props.disabled || (spec.disabled?.(context) ?? false),
          run: () => spec.run(context),
          handle: item === 'drag',
        },
      ]
    }
    const button = item as JeBlockButton
    const buttonDisabled =
      typeof button.disabled === 'function' ? button.disabled(context) : button.disabled === true
    return [
      {
        key: button.key,
        title: button.title,
        icon: button.icon,
        text: button.text,
        active: button.isActive?.(context) ?? false,
        disabled: props.disabled || buttonDisabled,
        run: () => button.onClick(context),
      },
    ]
  })

/** 顶部操作栏 */
const toolbarItems = computed(() =>
  resolveItems(props.toolbar ?? DEFAULT_TOOLBAR, insertTools, contextOf(undefined, -1), true),
)

/** 每块头部的按钮：拆成「把手」与「其余」，把手要单独放到左侧 */
const actionItems = computed(() =>
  localBlocks.value.map((block, index) => {
    const items = resolveItems(props.blockActions ?? DEFAULT_ACTIONS, actionTools, contextOf(block, index), false)
    return {
      handle: items.find((item) => item.handle),
      items: items.filter((item) => !item.handle),
    }
  }),
)

/* -------------------- 预览相关的小工具 -------------------- */

const urlPlaceholder = (type: JeBlockType) => {
  if (type === 'image') return t('block.imageUrl')
  if (type === 'video') return t('block.videoUrl')
  if (type === 'link') return t('block.linkUrl')
  return t('block.url')
}

const textPlaceholder = computed(() => props.placeholder ?? t('block.placeholder'))

const fitLabel = (fit: JeBlockFit) => {
  if (fit === 'cover') return t('block.fitCover')
  if (fit === 'fill') return t('block.fitFill')
  return t('block.fitContain')
}

/** 图片 / 视频的尺寸与缩放，编辑器预览与只读渲染用的是同一套取值口径 */
const mediaStyle = (block: JeBlock) => {
  if (block.type !== 'image' && block.type !== 'video') return {}
  return {
    width: block.width || '100%',
    height: block.height || undefined,
    // 显式给了高度就不再受预览里的 320px 上限约束
    maxHeight: block.height ? 'none' : undefined,
    objectFit: block.fit ?? 'contain',
  }
}

/** 块底部的尺寸摘要：改了宽高 / 缩放后不用打开弹窗也能看出效果 */
const sizeSummary = (block: JeBlock) => {
  if (block.type !== 'image' && block.type !== 'video') return ''
  return [
    `${t('block.width')} ${block.width || '100%'}`,
    `${t('block.height')} ${block.height || t('block.heightAuto')}`,
    fitLabel(block.fit ?? 'contain'),
  ].join(' · ')
}

defineExpose({
  /** 当前数据（深拷贝，可直接存库） */
  getDocument: buildDocument,
  /** 追加一个空块，返回新块的 id */
  addBlock,
  /** 打开某个块的编辑窗口 */
  openEditor,
  /** 清空所有块 */
  clear,
})
</script>

<template>
  <div class="je-block-editor" :class="{ 'is-disabled': disabled }">
    <div v-if="toolbarItems.length" class="je-block-editor__toolbar">
      <template v-for="item in toolbarItems" :key="item.key">
        <span v-if="item.divider" class="je-block-editor__divider" />
        <button
          v-else
          type="button"
          class="je-block-editor__btn"
          :class="{ 'is-active': item.active, 'je-block-editor__btn--text': item.text }"
          :title="item.title"
          :aria-label="item.title"
          :aria-pressed="item.active"
          :disabled="item.disabled"
          @click="item.run()"
        >
          <template v-if="item.text">{{ item.text }}</template>
          <template v-else-if="item.icon">
            <JeIcon :name="item.icon" :size="16" />
            <span class="je-block-editor__btn-label">{{ item.title }}</span>
          </template>
        </button>
      </template>
    </div>

    <div
      ref="listEl"
      class="je-block-editor__list"
      :class="{ 'is-dragging': dragIndex >= 0 }"
      @click.self="selectBlock('')"
    >
      <div
        v-for="(block, index) in localBlocks"
        :key="block.id"
        class="je-block-editor__item"
        :class="{
          'is-selected': selectedId === block.id,
          'is-dragging': dragIndex === index,
          'is-drop-before': dropIndex === index,
          'is-drop-after': dropIndex === localBlocks.length && index === localBlocks.length - 1,
        }"
        @click="selectBlock(block.id)"
        @dblclick="onBlockDblClick(block.id, $event)"
      >
        <!-- 头部图标只在选中时才出现，未选中时整块就是一份纯预览 -->
        <div v-if="selectedId === block.id" class="je-block-editor__head">
          <slot name="block-head" :block="block" :index="index" :edit="() => openEditor(block.id)">
            <button
              v-if="actionItems[index]?.handle"
              type="button"
              class="je-block-editor__handle"
              :title="actionItems[index]?.handle?.title"
              :aria-label="actionItems[index]?.handle?.title"
              :disabled="disabled"
              @click.stop
              @pointerdown.stop="startDrag(index, $event)"
            >
              <JeIcon name="drag" :size="14" />
            </button>
            <span class="je-block-editor__type">{{ t(`block.${block.type}`) }}</span>

            <span class="je-block-editor__gap" />

            <template v-for="item in actionItems[index]?.items ?? []" :key="item.key">
              <span v-if="item.divider" class="je-block-editor__divider" />
              <button
                v-else
                type="button"
                class="je-block-editor__action"
                :class="{ 'je-block-editor__action--danger': item.builtin === 'remove' }"
                :title="item.title"
                :aria-label="item.title"
                :disabled="item.disabled"
                @click.stop="item.run()"
              >
                <template v-if="item.text">{{ item.text }}</template>
                <JeIcon v-else-if="item.icon" :name="item.icon" :size="15" />
              </button>
            </template>
          </slot>
        </div>

        <!-- 文本块：一段文本就是一个块 -->
        <p v-if="block.type === 'text'" class="je-block-editor__text" :class="{ 'is-empty': !block.text }">
          {{ block.text || textPlaceholder }}
        </p>

        <template v-else>
          <img
            v-if="block.type === 'image' && block.url"
            class="je-block-editor__media"
            :style="mediaStyle(block)"
            :src="block.url"
            :alt="block.alt ?? ''"
          />
          <video
            v-else-if="block.type === 'video' && block.url && playingId === block.id"
            class="je-block-editor__media"
            :style="mediaStyle(block)"
            :src="block.url"
            :poster="block.poster || undefined"
            preload="none"
            controls
            autoplay
            playsinline
          />
          <!-- 没点播放键之前只放封面，播放器根本不挂载，视频文件一个字节都不拉 -->
          <div
            v-else-if="block.type === 'video' && block.url"
            class="je-block-editor__poster"
            :style="mediaStyle(block)"
          >
            <img v-if="block.poster" class="je-block-editor__cover" :src="block.poster" alt="" />
            <button
              type="button"
              class="je-block-editor__play"
              :title="t('block.play')"
              :aria-label="t('block.play')"
              @click.stop="playVideo(block.id)"
            >
              <JeIcon name="play" :size="18" />
            </button>
          </div>
          <span v-else-if="block.type === 'link' && block.url" class="je-block-editor__link">
            {{ block.title || block.url }}
          </span>
          <!-- 还没填地址时的占位，提示点编辑去补 -->
          <span v-else class="je-block-editor__placeholder">{{ urlPlaceholder(block.type) }}</span>

          <span v-if="block.type !== 'link' && block.url" class="je-block-editor__summary">
            {{ sizeSummary(block) }}
          </span>
        </template>
      </div>

      <p v-if="!localBlocks.length" class="je-block-editor__empty">{{ t('block.empty') }}</p>
    </div>

    <input
      ref="fileInput"
      class="je-block-editor__file"
      type="file"
      :accept="uploadAccept"
      :multiple="uploadMultiple"
      @change="onFileChange"
    />

    <slot name="footer" />

    <!-- 编辑窗口：改完点确定才写回列表 -->
    <JeDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="440"
      append-to-body
      @closed="onDialogClosed"
    >
      <div v-if="draft" class="je-block-editor__form">
        <label v-if="form.type === 'text'" class="je-block-editor__row">
          <span class="je-block-editor__label">{{ t('block.content') }}</span>
          <textarea
            v-model="form.text"
            class="je-block-editor__textarea"
            rows="6"
            :placeholder="textPlaceholder"
          />
        </label>

        <template v-else>
          <div class="je-block-editor__row">
            <span class="je-block-editor__label">{{ t('block.url') }}</span>
            <div class="je-block-editor__inline">
              <input
                v-model="form.url"
                class="je-block-editor__input"
                :placeholder="urlPlaceholder(form.type)"
              />
              <JeButton
                v-if="upload && form.type !== 'link'"
                variant="ghost"
                :loading="uploading"
                @click="pickFile(form.type)"
              >
                {{ form.type === 'image' ? t('block.pickImage') : t('block.pickVideo') }}
              </JeButton>
            </div>
          </div>

          <label v-if="form.type === 'image'" class="je-block-editor__row">
            <span class="je-block-editor__label">{{ t('block.alt') }}</span>
            <input
              v-model="form.alt"
              class="je-block-editor__input"
              :placeholder="t('block.altPlaceholder')"
            />
          </label>

          <label v-else-if="form.type === 'video'" class="je-block-editor__row">
            <span class="je-block-editor__label">{{ t('block.poster') }}</span>
            <input
              v-model="form.poster"
              class="je-block-editor__input"
              :placeholder="t('block.posterPlaceholder')"
            />
          </label>

          <label v-else class="je-block-editor__row">
            <span class="je-block-editor__label">{{ t('block.linkTitle') }}</span>
            <input
              v-model="form.title"
              class="je-block-editor__input"
              :placeholder="t('block.linkTitlePlaceholder')"
            />
          </label>

          <!-- 宽高与缩放只对图片 / 视频有意义 -->
          <template v-if="form.type !== 'link'">
            <div class="je-block-editor__row">
              <span class="je-block-editor__label">{{ t('block.width') }}</span>
              <div class="je-block-editor__chips">
                <button
                  v-for="preset in WIDTH_PRESETS"
                  :key="preset"
                  type="button"
                  class="je-block-editor__chip"
                  :class="{ 'is-active': form.width === preset }"
                  @click="setWidthPreset(preset)"
                >
                  {{ preset }}
                </button>
                <span class="je-block-editor__length">
                  <input
                    class="je-block-editor__input je-block-editor__input--number"
                    inputmode="decimal"
                    :value="widthNumber"
                    :placeholder="t('block.custom')"
                    @input="onWidthNumber(($event.target as HTMLInputElement).value)"
                  />
                  <button
                    v-for="unit in UNIT_OPTIONS"
                    :key="unit"
                    type="button"
                    class="je-block-editor__chip je-block-editor__chip--unit"
                    :class="{ 'is-active': widthUnit === unit }"
                    @click="onWidthUnit(unit)"
                  >
                    {{ unit }}
                  </button>
                </span>
              </div>
            </div>

            <div class="je-block-editor__row">
              <span class="je-block-editor__label">{{ t('block.height') }}</span>
              <div class="je-block-editor__chips">
                <span class="je-block-editor__length">
                  <input
                    class="je-block-editor__input je-block-editor__input--number"
                    inputmode="decimal"
                    :value="heightNumber"
                    :placeholder="t('block.heightAuto')"
                    @input="onHeightNumber(($event.target as HTMLInputElement).value)"
                  />
                  <button
                    v-for="unit in UNIT_OPTIONS"
                    :key="unit"
                    type="button"
                    class="je-block-editor__chip je-block-editor__chip--unit"
                    :class="{ 'is-active': heightUnit === unit }"
                    @click="onHeightUnit(unit)"
                  >
                    {{ unit }}
                  </button>
                </span>
              </div>
            </div>

            <div class="je-block-editor__row">
              <span class="je-block-editor__label">{{ t('block.fit') }}</span>
              <div class="je-block-editor__chips">
                <button
                  v-for="option in FIT_OPTIONS"
                  :key="option"
                  type="button"
                  class="je-block-editor__chip"
                  :class="{ 'is-active': form.fit === option }"
                  @click="form.fit = option"
                >
                  {{ fitLabel(option) }}
                </button>
              </div>
            </div>
          </template>
        </template>
      </div>

      <template #footer>
        <JeButton variant="ghost" @click="closeEditor">{{ t('cancel') }}</JeButton>
        <JeButton @click="applyDraft()">{{ t('confirm') }}</JeButton>
      </template>
    </JeDialog>
  </div>
</template>

<style scoped>
.je-block-editor {
  display: block;
  font-size: var(--je-control-fs);
  color: var(--je-text);
}

/* ---------------- 顶部操作栏 ---------------- */

.je-block-editor__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding-bottom: 12px;
}

.je-block-editor__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--je-control-h);
  padding: 0 var(--je-control-px);
  font-size: var(--je-control-fs);
  color: var(--je-text-muted);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-control-radius);
  cursor: pointer;
  transition: color var(--je-duration), background var(--je-duration), border-color var(--je-duration);
}

.je-block-editor__btn:hover:not(:disabled) {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-block-editor__btn.is-active {
  color: var(--je-primary);
  border-color: var(--je-primary);
}

.je-block-editor__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.je-block-editor__btn-label {
  line-height: 1;
}

.je-block-editor__divider {
  width: 1px;
  height: 16px;
  background: var(--je-border-color);
}

/* ---------------- 块列表 ---------------- */

.je-block-editor__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 拖动过程中别让指针把页面文字选中 */
.je-block-editor__list.is-dragging {
  user-select: none;
}

.je-block-editor__item {
  position: relative;
  /* 每块都占满一行 */
  width: 100%;
  padding: 10px 12px 12px;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  cursor: pointer;
  transition: border-color var(--je-duration), box-shadow var(--je-duration), opacity var(--je-duration);
}

.je-block-editor__item:hover {
  border-color: var(--je-text-faint);
}

/* 选中效果：主色边框 + 一圈淡淡的外发光 */
.je-block-editor__item.is-selected {
  border-color: var(--je-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--je-primary) 20%, transparent);
}

.je-block-editor__item.is-dragging {
  opacity: 0.55;
}

/* 插入位置指示线：越过中线插到前一块的下面、后一块的上面 */
.je-block-editor__item.is-drop-before::before,
.je-block-editor__item.is-drop-after::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--je-primary);
  border-radius: 1px;
}

.je-block-editor__item.is-drop-before::before {
  top: -7px;
}

.je-block-editor__item.is-drop-after::after {
  bottom: -7px;
}

/* ---------------- 块头部（只在选中时渲染） ---------------- */

.je-block-editor__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: var(--je-text-faint);
}

.je-block-editor__handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--je-text-faint);
  background: transparent;
  border: none;
  border-radius: var(--je-control-radius-sm);
  cursor: grab;
  touch-action: none;
}

.je-block-editor__handle:hover:not(:disabled) {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-block-editor__handle:active {
  cursor: grabbing;
}

.je-block-editor__handle:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.je-block-editor__type {
  font-size: var(--je-control-fs-sm);
  color: var(--je-text-faint);
}

.je-block-editor__gap {
  flex: 1;
}

.je-block-editor__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 4px;
  font-size: var(--je-control-fs-sm);
  color: var(--je-text-faint);
  background: transparent;
  border: none;
  border-radius: var(--je-control-radius-sm);
  cursor: pointer;
  transition: color var(--je-duration), background var(--je-duration);
}

.je-block-editor__action:hover:not(:disabled) {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-block-editor__action--danger:hover:not(:disabled) {
  color: var(--je-danger);
}

.je-block-editor__action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ---------------- 块内容预览 ---------------- */

.je-block-editor__text {
  margin: 0;
  font-size: var(--je-control-fs);
  line-height: 1.7;
  color: var(--je-text);
  white-space: pre-wrap;
  word-break: break-word;
}

.je-block-editor__text.is-empty {
  color: var(--je-text-faint);
}

.je-block-editor__media {
  display: block;
  max-height: 320px;
  object-fit: contain;
  background: var(--je-surface-hover);
  border-radius: var(--je-radius-sm);
}

/* 视频的封面态：没点播放之前只显示它 */
.je-block-editor__poster {
  position: relative;
  display: block;
  min-height: 180px;
  max-height: 320px;
  overflow: hidden;
  background: var(--je-surface-hover);
  border-radius: var(--je-radius-sm);
}

.je-block-editor__cover {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.je-block-editor__play {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  color: #fff;
  background: color-mix(in srgb, var(--je-text) 55%, transparent);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transform: translate(-50%, -50%);
  transition: background var(--je-duration);
}

.je-block-editor__play:hover {
  background: var(--je-primary);
}

.je-block-editor__link {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  font-size: var(--je-control-fs);
  color: var(--je-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-block-editor__placeholder {
  display: block;
  padding: 18px 12px;
  font-size: var(--je-control-fs-sm);
  color: var(--je-text-faint);
  text-align: center;
  border: 1px dashed var(--je-border-color);
  border-radius: var(--je-radius-sm);
}

.je-block-editor__summary {
  display: block;
  margin-top: 8px;
  font-size: var(--je-control-fs-sm);
  color: var(--je-text-faint);
}

.je-block-editor__empty {
  margin: 0;
  padding: 20px;
  font-size: var(--je-control-fs-sm);
  color: var(--je-text-faint);
  text-align: center;
  background: var(--je-surface);
  border: 1px dashed var(--je-border-color);
  border-radius: var(--je-radius);
}

/* 隐藏的文件选择框：由编辑窗口里的按钮代触发 */
.je-block-editor__file {
  display: none;
}

/* ---------------- 编辑窗口 ---------------- */

.je-block-editor__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.je-block-editor__row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.je-block-editor__label {
  font-size: var(--je-control-fs-sm);
  color: var(--je-text-muted);
}

.je-block-editor__inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.je-block-editor__input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  height: var(--je-control-h);
  padding: 0 var(--je-control-px-sm);
  font-family: inherit;
  font-size: var(--je-control-fs-sm);
  color: var(--je-text);
  background: var(--je-popup);
  border: var(--je-border);
  border-radius: var(--je-control-radius);
  outline: none;
}

/* 只有和按钮同排（地址那一行）时才让它吃掉剩余宽度 */
.je-block-editor__inline .je-block-editor__input {
  flex: 1;
  width: auto;
}

.je-block-editor__input:focus {
  border-color: var(--je-primary);
}

.je-block-editor__input--number {
  width: 72px;
}

.je-block-editor__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px var(--je-control-px-sm);
  font-family: inherit;
  font-size: var(--je-control-fs);
  line-height: 1.7;
  color: var(--je-text);
  background: var(--je-popup);
  border: var(--je-border);
  border-radius: var(--je-control-radius);
  outline: none;
  resize: vertical;
}

.je-block-editor__textarea:focus {
  border-color: var(--je-primary);
}

.je-block-editor__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.je-block-editor__length {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.je-block-editor__chip {
  height: var(--je-control-h);
  box-sizing: border-box;
  padding: 0 var(--je-control-px-sm);
  font-size: var(--je-control-fs-sm);
  color: var(--je-text-muted);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-control-radius);
  cursor: pointer;
  transition: color var(--je-duration), background var(--je-duration), border-color var(--je-duration);
}

.je-block-editor__chip:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-block-editor__chip.is-active {
  color: var(--je-primary);
  border-color: var(--je-primary);
}

.je-block-editor__chip--unit {
  min-width: 32px;
  padding: 0 6px;
}
</style>
