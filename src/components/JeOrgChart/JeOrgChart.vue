<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import {
  CANVAS_FONT_FAMILY,
  drawImageInBox,
  isTransparent,
  loadImage,
  resolveCssColor,
  roundRectPath,
} from '../../core/canvas'
import { jePresets } from '../../core/presets'
import { useSpring } from '../../core/useSpring'
import {
  layoutTree,
  treeAncestors,
  treeParentMap,
  type JeTreeLayout,
  type JeTreeLayoutNode,
} from '../../core/treeLayout'
import type {
  JeOrgChartExportOptions,
  JeOrgChartHit,
  JeOrgChartNode,
  JeOrgChartProps,
  JeOrgChartSpouse,
} from './types'
import { useJeLocale } from '../JeLocale'

defineOptions({ name: 'JeOrgChart' })

const props = withDefaults(defineProps<JeOrgChartProps>(), {
  rootId: undefined,
  nodeWidth: 208,
  nodeHeight: 76,
  gapX: 32,
  gapY: 64,
  spouseWidth: undefined,
  spouseGap: 20,
  defaultExpandDepth: 2,
  minScale: 0.12,
  maxScale: 2.5,
  linkStyle: 'curve',
  editable: false,
  draggable: false,
  addable: false,
  removable: false,
  undoable: false,
  renderNode: undefined,
  background: '',
  label: '组织架构图',
})

const emit = defineEmits<{
  /** 点击节点卡片时触发（点折叠按钮与配偶卡不会触发它），第二个参数是原始鼠标 / 触摸事件 */
  'node-click': [node: JeOrgChartNode, event: MouseEvent]
  /** 点击配偶卡时触发，第二、三个参数是配偶所属的主节点与原始鼠标 / 触摸事件 */
  'spouse-click': [spouse: JeOrgChartSpouse, host: JeOrgChartNode, event: MouseEvent]
  /** 折叠或展开一个节点后触发，collapsed 是切换后的状态 */
  toggle: [node: JeOrgChartNode, collapsed: boolean]
  /** locate() 命中一个节点后触发 */
  locate: [node: JeOrgChartNode]
  /**
   * 编辑保存后触发（仅 editable 为 true 时会有），抛出替换后的完整扁平数组，
   * 配合 v-model:nodes 使用；组件只抛数据，落库 / 校验 / 撤销由业务侧决定
   */
  'update:nodes': [nodes: JeOrgChartNode[]]
  /**
   * 拖拽改层级松手后触发（仅 draggable 为 true 且落点合法时会有）：依次是移动的节点、
   * 原父 id、新父 id（无父时为 null）。与 update:nodes 同时抛出，前者供业务记账 / 提示，
   * 后者直接喂给 v-model:nodes
   */
  'node-move': [node: JeOrgChartNode, oldParentId: string | null, newParentId: string | null]
  /**
   * 新增节点后触发（仅 addable 为 true 时会有）：依次是新建的节点与它的父 id。
   * 与 update:nodes 同时抛出 —— 前者供业务记账 / 提示，后者直接喂给 v-model:nodes
   */
  'node-add': [node: JeOrgChartNode, parentId: string | null]
  /**
   * 删除节点后触发（仅 removable 为 true 时会有）：依次是被删除的整棵子树（含该节点自身）
   * 与被点的那个节点。与 update:nodes 同时抛出
   */
  'node-remove': [removed: JeOrgChartNode[], node: JeOrgChartNode]
  /**
   * 撤销 / 重做的可用状态变化时触发（需 undoable），两个参数分别是「能否撤销」「能否重做」
   */
  'history-change': [canUndo: boolean, canRedo: boolean]
}>()

/** 内置编辑浮层的文案（名称 / 副标题标签，确定 / 取消复用通用键） */
const { t } = useJeLocale()

/** 卡片圆角（设计稿 px） */
const NODE_RADIUS = 14
/** 折叠按钮半径（设计稿 px），圆心落在节点块下沿中点 */
const TOGGLE_RADIUS = 10
/**
 * 折叠按钮的触控热区半径（直径 44px，满足移动端最小触控尺寸）。
 * 中心比视觉按钮略向下偏移，避免整个热区压到卡片本体上、把卡片自身的点击也吞掉。
 */
const TOGGLE_HIT_RADIUS = 22
const TOGGLE_HIT_OFFSET_Y = 10
/** 卡片内边距 */
const PADDING_X = 14
/** 头像半径：完整形态 / 精简形态 */
const AVATAR_RADIUS = 22
const AVATAR_RADIUS_SMALL = 16
/** 配偶卡头像半径：完整形态 / 精简形态 */
const SPOUSE_AVATAR_RADIUS = 18
const SPOUSE_AVATAR_RADIUS_SMALL = 13
/** 头像与文字之间的间距 */
const TEXT_GAP = 12
/** 计数徽标：高度、左右内边距、距卡片右上角的内缩 */
const BADGE_HEIGHT = 18
const BADGE_PADDING = 7
const BADGE_INSET = 8
/** 缩放小于这个值时不再画文字，只留卡片色块 */
const NAME_SCALE = 0.55
/** 缩放小于这个值时不再画头像与副标题 */
const DETAIL_SCALE = 0.8
/** 缩放小于这个值时连折叠按钮也省掉 */
const TOGGLE_SCALE = 0.35
/** 导出位图的最大边长，避免整棵大树撑爆 canvas 尺寸上限 */
const MAX_EXPORT_SIZE = 8192
/** 详情浮层：与卡片的间距、距容器边缘的最小内缩 */
const POPUP_GAP = 16
const POPUP_MARGIN = 8
/** 拖拽改层级的启动阈值（px）：位移超过它才算拖拽，否则仍按点击处理 */
const DRAG_THRESHOLD = 4

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

interface Palette {
  nodeFill: string
  nodeFillEnd: string
  nodeFillHover: string
  nodeBorder: string
  nodeBorderActive: string
  text: string
  textMuted: string
  edge: string
  accent: string
  accentEnd: string
  onColor: string
  spouseFill: string
  spouseAvatarFill: string
}

interface ViewRect {
  x: number
  y: number
  width: number
  height: number
}

const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
/** 用于探测 node-popup / spouse-popup 插槽是否提供 */
const slots = useSlots()

/** 容器 CSS 尺寸（canvas 位图按 devicePixelRatio 放大，坐标仍走 CSS 像素） */
const width = ref(0)
const height = ref(0)

/** 折叠集合 + 视口（scale / 平移）—— 三者变化都只触发重绘，不重算布局 */
const collapsed = ref<Set<string>>(new Set())
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

const hoverId = ref<string | null>(null)
/** 悬停中的配偶卡下标（配合 hoverId 用）；非配偶卡时为 null */
const hoverSpouseIndex = ref<number | null>(null)
const activeId = ref<string | null>(null)
/** 选中的配偶卡下标（配合 activeId 用）；选中的是主卡时为 null */
const activeSpouseIndex = ref<number | null>(null)
const panning = ref(false)
/** 悬停命中的区域（body / toggle / spouse），只用于决定光标形态 */
const hoverZone = ref<JeOrgChartHit['zone'] | null>(null)

/** 拖拽改层级：达到阈值后才置上的被拖节点 id、当前落点目标 id、指针的世界坐标 */
const dragId = ref<string | null>(null)
const dragTargetId = ref<string | null>(null)
const dragPointer = ref<{ x: number; y: number } | null>(null)
/** 已按下但还没越过阈值的候选（此时仍可能是「点击」） */
let dragCandidate: { id: string; x: number; y: number } | null = null
const palette = ref<Palette | null>(null)
/** 头像图片就绪计数：每加载完一批 +1 触发一次重绘 */
const imageVersion = ref(0)

const images = new Map<string, HTMLImageElement | null>()
let loadToken = 0

/* ---------------------------------------------------------------- 数据 */

const nodeMap = computed(() => {
  const map = new Map<string, JeOrgChartNode>()
  for (const node of props.nodes ?? []) {
    const id = String(node.id)
    if (!map.has(id)) map.set(id, node)
  }
  return map
})

/** 配偶统一按数组处理：单个 / 数组都接受 */
const spousesOf = (node: JeOrgChartNode | undefined): JeOrgChartSpouse[] => {
  const raw = node?.spouse
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

const spouseWidth = computed(() => props.spouseWidth ?? props.nodeWidth)

/** 节点块占用的水平宽度 = 主卡 + 并排的各张配偶卡（布局按整块居中） */
const boxWidthOf = (node: JeOrgChartNode | undefined): number =>
  props.nodeWidth + spousesOf(node).length * (props.spouseGap + spouseWidth.value)

/** 第 index 张配偶卡的左上角 x（世界坐标） */
const spouseX = (node: { x: number }, index: number): number =>
  node.x + props.nodeWidth + props.spouseGap + index * (spouseWidth.value + props.spouseGap)

const sources = computed(() => {
  const list = [...nodeMap.value.entries()].map(([id, node]) => ({
    id,
    parentId: node.parentId == null ? null : String(node.parentId),
    boxWidth: boxWidthOf(node),
  }))
  const rootId = props.rootId == null ? null : String(props.rootId)
  if (!rootId || !nodeMap.value.has(rootId)) return list

  // 指定了 rootId：只保留它可达的子树
  const children = new Map<string, string[]>()
  for (const item of list) {
    if (!item.parentId) continue
    const bucket = children.get(item.parentId)
    if (bucket) bucket.push(item.id)
    else children.set(item.parentId, [item.id])
  }
  const keep = new Set<string>()
  const walk = (id: string) => {
    if (keep.has(id)) return
    keep.add(id)
    for (const childId of children.get(id) ?? []) walk(childId)
  }
  walk(rootId)
  return list.filter((item) => keep.has(item.id))
})

const parentMap = computed(() => treeParentMap(sources.value))

const layout = computed<JeTreeLayout>(() =>
  layoutTree(sources.value, collapsed.value, {
    nodeWidth: props.nodeWidth,
    nodeHeight: props.nodeHeight,
    gapX: props.gapX,
    gapY: props.gapY,
  }),
)

/* ------------------------------------------------------------ 折叠状态 */

/** 单个节点的深度（按 parentId 逐级上溯，带缓存与成环保护） */
const depthOf = (id: string, cache: Map<string, number>, visiting: Set<string>): number => {
  const cached = cache.get(id)
  if (cached !== undefined) return cached
  if (visiting.has(id)) return 0
  visiting.add(id)
  const parent = parentMap.value.get(id) ?? null
  const depth = parent && parent !== id ? depthOf(parent, cache, visiting) + 1 : 0
  visiting.delete(id)
  cache.set(id, depth)
  return depth
}

/** 按 defaultExpandDepth 重置折叠集合：深度 >= 该值的节点一律折叠 */
const applyDefaultCollapse = () => {
  const cache = new Map<string, number>()
  const next = new Set<string>()
  for (const id of nodeMap.value.keys()) {
    if (depthOf(id, cache, new Set()) >= props.defaultExpandDepth) next.add(id)
  }
  collapsed.value = next
}

const toggleNode = (id: string, force?: boolean) => {
  const next = new Set(collapsed.value)
  const target = force ?? !next.has(id)
  if (target) next.add(id)
  else next.delete(id)
  collapsed.value = next
  const data = nodeMap.value.get(id)
  if (data) emit('toggle', data, target)
}

/** 展开从根到 id 的整条祖先链（locate 与 expandTo 共用） */
const expandTo = (id: string) => {
  const ancestors = treeAncestors(parentMap.value, id)
  if (!ancestors.length) return
  const next = new Set(collapsed.value)
  let changed = false
  for (const ancestor of ancestors) if (next.delete(ancestor)) changed = true
  if (changed) collapsed.value = next
}

const expandAll = () => {
  collapsed.value = new Set()
}

const collapseTo = (depth = 0) => {
  const cache = new Map<string, number>()
  const next = new Set<string>()
  for (const id of nodeMap.value.keys()) {
    if (depthOf(id, cache, new Set()) >= depth) next.add(id)
  }
  collapsed.value = next
}

/* -------------------------------------------------------------- 视口 */

const centerContent = () => {
  const l = layout.value
  if (!width.value || !height.value || !l.width) return
  offsetX.value = (width.value - l.width * scale.value) / 2
  offsetY.value = (height.value - l.height * scale.value) / 2
}

/** 初次进入：装得下就整棵居中，装不下就 1:1 从根节点看起 */
const resetView = () => {
  const l = layout.value
  if (!width.value || !height.value || !l.width) return
  const padding = 24
  const fitScale = Math.min(
    (width.value - padding * 2) / l.width,
    (height.value - padding * 2) / l.height,
  )
  if (fitScale >= 0.6) {
    scale.value = clamp(Math.min(1, fitScale), props.minScale, props.maxScale)
    centerContent()
    return
  }
  scale.value = clamp(1, props.minScale, props.maxScale)
  const root = l.index.get(l.roots[0] ?? '')
  offsetX.value = root
    ? width.value / 2 - (root.x + root.boxWidth / 2) * scale.value
    : (width.value - l.width * scale.value) / 2
  offsetY.value = padding
}

/** 把整张图适配进视口（可能缩到很小，用于「总览」） */
const fit = () => {
  const l = layout.value
  if (!width.value || !height.value || !l.width) return
  const padding = 24
  scale.value = clamp(
    Math.min(
      (width.value - padding * 2) / l.width,
      (height.value - padding * 2) / l.height,
    ),
    props.minScale,
    props.maxScale,
  )
  centerContent()
}

const zoomAt = (localX: number, localY: number, nextScale: number) => {
  const next = clamp(nextScale, props.minScale, props.maxScale)
  const k = next / scale.value
  offsetX.value = localX - (localX - offsetX.value) * k
  offsetY.value = localY - (localY - offsetY.value) * k
  scale.value = next
}

const localOf = (clientX: number, clientY: number) => {
  const rect = canvasRef.value?.getBoundingClientRect()
  return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) }
}

/* ------------------------------------------------------------ 飞行定位 */

const flyProgress = useSpring(0, jePresets.soft)
let flyFrom = { scale: 1, offsetX: 0, offsetY: 0 }
let flyTarget: { scale: number; offsetX: number; offsetY: number } | null = null

const flyTo = (id: string) => {
  const node = layout.value.index.get(id)
  if (!node || !width.value || !height.value) return
  const nextScale = clamp(Math.max(scale.value, 1), props.minScale, props.maxScale)
  flyFrom = { scale: scale.value, offsetX: offsetX.value, offsetY: offsetY.value }
  flyTarget = {
    scale: nextScale,
    offsetX: width.value / 2 - (node.x + node.boxWidth / 2) * nextScale,
    offsetY: height.value / 2 - (node.y + props.nodeHeight / 2) * nextScale,
  }
  flyProgress.jump(0)
  flyProgress.set(1)
}

watch(flyProgress.value, (progress) => {
  if (!flyTarget) return
  scale.value = flyFrom.scale + (flyTarget.scale - flyFrom.scale) * progress
  offsetX.value = flyFrom.offsetX + (flyTarget.offsetX - flyFrom.offsetX) * progress
  offsetY.value = flyFrom.offsetY + (flyTarget.offsetY - flyFrom.offsetY) * progress
})

/* -------------------------------------------------------------- 绘制 */

/**
 * 读取主题色。每一项都写成 `var(--je-org-xxx, 内置派生值)`：
 * 不设变量时用组件内现算的派生色（跟随明暗主题），设了就整体跟你的色走 ——
 * 这是「不写一行 JS 换皮肤」的入口（见硬性约定 2：派生色一律在组件内算，不新增全局 token）。
 */
const readPalette = () => {
  const host = rootRef.value
  if (!host) return
  const color = (css: string) => resolveCssColor(host, css, 'color')
  const fill = (css: string) => resolveCssColor(host, css, 'background-color')
  palette.value = {
    nodeFill: fill(
      'var(--je-org-node-fill, var(--je-surface))',
    ),
    nodeFillEnd: fill(
      'var(--je-org-node-fill-end, color-mix(in srgb, var(--je-surface) 78%, var(--je-bg-page-from)))',
    ),
    nodeFillHover: fill(
      'var(--je-org-node-fill-hover, color-mix(in srgb, var(--je-bg-page-from) 88%, var(--je-primary)))',
    ),
    nodeBorder: color('var(--je-org-node-border, var(--je-border-color))'),
    nodeBorderActive: color('var(--je-org-node-accent, var(--je-primary))'),
    text: color('var(--je-org-node-text, var(--je-text))'),
    textMuted: color('var(--je-org-node-text-muted, var(--je-text-muted))'),
    edge: color('var(--je-org-edge, var(--je-border-color))'),
    accent: color('var(--je-org-node-accent, var(--je-primary))'),
    accentEnd: color('var(--je-org-node-accent-end, var(--je-primary-end))'),
    onColor: color('var(--je-org-node-on-color, var(--je-text-on-color))'),
    spouseFill: fill(
      'var(--je-org-spouse-fill, color-mix(in srgb, var(--je-bg-page-from) 92%, var(--je-surface)))',
    ),
    spouseAvatarFill: fill(
      'var(--je-org-spouse-avatar-fill, var(--je-border-color))',
    ),
  }
}

const intersects = (view: ViewRect, x: number, y: number, w: number, h: number) =>
  x < view.x + view.width && x + w > view.x && y < view.y + view.height && y + h > view.y

const ellipsize = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
  if (!text) return ''
  if (ctx.measureText(text).width <= maxWidth) return text
  let result = ''
  for (const char of Array.from(text)) {
    if (ctx.measureText(`${result}${char}…`).width > maxWidth) break
    result += char
  }
  return result ? `${result}…` : '…'
}

const initialOf = (name: string): string => {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return '?'
  // 中文取姓氏一个字，西文取首字母
  return /[\u4e00-\u9fff]/.test(trimmed[0]) ? trimmed[0] : trimmed[0].toUpperCase()
}

/**
 * 连线。三种样式都先算「父节点块底边中点 → 子节点块顶边中点」，再决定怎么连：
 * - curve（缺省）：两条控制点都压在垂直中线上，得到一条从父节点垂直出发、垂直落到子节点的 S 形。
 *   相邻父节点的曲线互不重叠，一级人很多时也能一眼看清谁是谁的下级（肘形会连成一片）。
 * - elbow：经典的直角肘形，先下、再横、再下。
 * - straight：直接从底边中点斜到顶边中点。
 * 全部合成一条 path 后只 stroke 一次。
 */
const drawEdges = (
  ctx: CanvasRenderingContext2D,
  view: ViewRect,
  p: Palette,
  s: number,
) => {
  ctx.strokeStyle = p.edge
  ctx.lineWidth = 1.5 / s
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const style = props.linkStyle
  ctx.beginPath()
  for (const edge of layout.value.edges) {
    const left = Math.min(edge.fromX, edge.toX)
    const right = Math.max(edge.fromX, edge.toX)
    if (!intersects(view, left - 8, edge.fromY, right - left + 16, edge.toY - edge.fromY)) continue
    ctx.moveTo(edge.fromX, edge.fromY)
    if (style === 'straight') {
      ctx.lineTo(edge.toX, edge.toY)
      continue
    }
    const midY = (edge.fromY + edge.toY) / 2
    if (style === 'elbow') {
      ctx.lineTo(edge.fromX, midY)
      ctx.lineTo(edge.toX, midY)
      ctx.lineTo(edge.toX, edge.toY)
      continue
    }
    ctx.bezierCurveTo(edge.fromX, midY, edge.toX, midY, edge.toX, edge.toY)
  }
  ctx.stroke()
}

const drawAvatar = (
  ctx: CanvasRenderingContext2D,
  data: JeOrgChartNode | undefined,
  cx: number,
  cy: number,
  radius: number,
  p: Palette,
) => {
  const image = data?.avatar ? images.get(data.avatar) ?? null : null
  if (image) {
    drawImageInBox(
      ctx,
      image,
      { x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2 },
      { fit: 'cover', radius },
    )
    return
  }
  const gradient = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
  gradient.addColorStop(0, p.accent)
  gradient.addColorStop(1, p.accentEnd)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = p.onColor
  ctx.font = `600 ${Math.round(radius * 0.95)}px ${CANVAS_FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(initialOf(data?.name ?? ''), cx, cy + 1)
}

/** 折叠按钮：收起态画「+」，展开态画「−」—— 人数改由卡片右上角的徽标承担，不再挤在这里 */
const drawToggle = (
  ctx: CanvasRenderingContext2D,
  node: JeTreeLayoutNode,
  isCollapsed: boolean,
  p: Palette,
  s: number,
) => {
  const cx = node.x + node.boxWidth / 2
  const cy = node.y + props.nodeHeight
  ctx.beginPath()
  ctx.arc(cx, cy, TOGGLE_RADIUS, 0, Math.PI * 2)

  if (isCollapsed) {
    const gradient = ctx.createLinearGradient(
      cx - TOGGLE_RADIUS,
      cy - TOGGLE_RADIUS,
      cx + TOGGLE_RADIUS,
      cy + TOGGLE_RADIUS,
    )
    gradient.addColorStop(0, p.accent)
    gradient.addColorStop(1, p.accentEnd)
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.strokeStyle = p.onColor
    ctx.lineWidth = 1.8 / s
    ctx.beginPath()
    ctx.moveTo(cx - 4, cy)
    ctx.lineTo(cx + 4, cy)
    ctx.moveTo(cx, cy - 4)
    ctx.lineTo(cx, cy + 4)
    ctx.stroke()
    return
  }

  ctx.fillStyle = p.nodeFill
  ctx.fill()
  ctx.strokeStyle = p.nodeBorderActive
  ctx.lineWidth = 1.2 / s
  ctx.stroke()
  ctx.strokeStyle = p.nodeBorderActive
  ctx.lineWidth = 1.6 / s
  ctx.beginPath()
  ctx.moveTo(cx - 4, cy)
  ctx.lineTo(cx + 4, cy)
  ctx.stroke()
}

/** 主卡右上角的计数徽标：下级人数为 0 时整个不画 */
const drawBadge = (
  ctx: CanvasRenderingContext2D,
  node: JeTreeLayoutNode,
  p: Palette,
) => {
  if (!node.childCount) return
  const text = node.childCount > 99 ? '99+' : String(node.childCount)
  ctx.font = `600 11px ${CANVAS_FONT_FAMILY}`
  const badgeWidth = Math.max(BADGE_HEIGHT, ctx.measureText(text).width + BADGE_PADDING * 2)
  const x = node.x + props.nodeWidth - BADGE_INSET - badgeWidth
  const y = node.y + BADGE_INSET
  const box = { x, y, width: badgeWidth, height: BADGE_HEIGHT }
  const gradient = ctx.createLinearGradient(x, y, x + badgeWidth, y + BADGE_HEIGHT)
  gradient.addColorStop(0, p.accent)
  gradient.addColorStop(1, p.accentEnd)
  ctx.fillStyle = gradient
  roundRectPath(ctx, box, BADGE_HEIGHT / 2)
  ctx.fill()
  ctx.fillStyle = p.onColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + badgeWidth / 2, y + BADGE_HEIGHT / 2 + 0.5)
}

/**
 * 配偶卡：并排画在主卡右侧，中间用一条婚姻连线相连；本身不挂下级。
 * 卡面与主卡**共用 renderNode**（`zone === 'spouse'`），但婚姻连线不受它影响，始终由组件画。
 */
const drawSpouseCard = (
  ctx: CanvasRenderingContext2D,
  host: JeTreeLayoutNode,
  hostData: JeOrgChartNode,
  spouse: JeOrgChartSpouse,
  index: number,
  p: Palette,
  s: number,
  showName: boolean,
  showDetail: boolean,
  hovered: boolean,
  active: boolean,
) => {
  const w = spouseWidth.value
  const h = props.nodeHeight
  const x = spouseX(host, index)
  const y = host.y

  // 婚姻连线：主卡右沿中点 → 配偶卡左沿中点
  ctx.strokeStyle = p.edge
  ctx.lineWidth = 1.5 / s
  ctx.beginPath()
  ctx.moveTo(host.x + props.nodeWidth, y + h / 2)
  ctx.lineTo(x, y + h / 2)
  ctx.stroke()

  // 自定义画法：与主卡共用 renderNode，用 zone 区分；返回 false 表示配偶卡面不用内置画法
  if (props.renderNode) {
    ctx.save()
    ctx.translate(x, y)
    const result = props.renderNode({
      ctx,
      node: hostData,
      zone: 'spouse',
      spouse,
      layout: host,
      width: w,
      height: h,
      scale: s,
      hovered,
      active,
      theme: p,
      radius: NODE_RADIUS,
    })
    ctx.restore()
    if (result === false) return
  }

  const box = { x, y, width: w, height: h }
  ctx.fillStyle = hovered || active ? p.nodeFillHover : p.spouseFill
  roundRectPath(ctx, box, NODE_RADIUS)
  ctx.fill()
  ctx.strokeStyle = hovered || active ? p.nodeBorderActive : p.nodeBorder
  ctx.lineWidth = (hovered || active ? 1.6 : 1) / s
  ctx.stroke()

  if (!showName) return
  const radius = showDetail ? SPOUSE_AVATAR_RADIUS : SPOUSE_AVATAR_RADIUS_SMALL
  const cx = x + PADDING_X + radius
  const cy = y + h / 2
  const image = spouse.avatar ? images.get(spouse.avatar) ?? null : null
  if (image) {
    drawImageInBox(ctx, image, { x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2 }, {
      fit: 'cover',
      radius,
    })
  } else {
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fillStyle = p.spouseAvatarFill
    ctx.fill()
    ctx.fillStyle = p.textMuted
    ctx.font = `600 ${Math.round(radius * 0.95)}px ${CANVAS_FONT_FAMILY}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initialOf(spouse.name), cx, cy + 1)
  }

  const textLeft = x + PADDING_X + radius * 2 + TEXT_GAP
  const maxWidth = x + w - PADDING_X - textLeft
  if (maxWidth <= 8) return
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = p.text
  ctx.font = `600 ${showDetail ? 14 : 13}px ${CANVAS_FONT_FAMILY}`
  ctx.fillText(
    ellipsize(ctx, spouse.name, maxWidth),
    textLeft,
    showDetail ? cy - 9 : cy,
  )
  if (showDetail && spouse.title) {
    ctx.fillStyle = p.textMuted
    ctx.font = `400 12px ${CANVAS_FONT_FAMILY}`
    ctx.fillText(ellipsize(ctx, spouse.title, maxWidth), textLeft, cy + 11)
  }
}

const drawNodes = (
  ctx: CanvasRenderingContext2D,
  view: ViewRect,
  p: Palette,
  s: number,
  highlight = true,
) => {
  const showName = s >= NAME_SCALE
  const showDetail = s >= DETAIL_SCALE
  const showToggle = s >= TOGGLE_SCALE
  const { nodeWidth, nodeHeight } = props

  for (const node of layout.value.nodes) {
    // 裁剪按整块宽度算，否则配偶卡会被判在视口外整体不画
    if (!intersects(view, node.x, node.y, node.boxWidth, nodeHeight + TOGGLE_RADIUS * 2)) continue

    const data = nodeMap.value.get(node.id)
    // 选中的是配偶卡时主卡不再高亮，避免「浮层指向配偶、主卡却亮着」
    const isActive = highlight && node.id === activeId.value && activeSpouseIndex.value === null
    const isHover = highlight && node.id === hoverId.value
    const isCollapsed = collapsed.value.has(node.id)
    const box = { x: node.x, y: node.y, width: nodeWidth, height: nodeHeight }

    // 配偶卡（含中间的婚姻连线）先画，主卡随后压在同一层之上
    if (data) {
      const spouses = spousesOf(data)
      const activeSpouse = activeSpouseIndex.value
      for (let i = 0; i < spouses.length; i += 1) {
        drawSpouseCard(
          ctx,
          node,
          data,
          spouses[i],
          i,
          p,
          s,
          showName,
          showDetail,
          highlight && node.id === hoverId.value && hoverSpouseIndex.value === i,
          highlight && node.id === activeId.value && activeSpouse === i,
        )
      }
    }

    // 自定义画法：返回 false 表示「内置卡片不用画了」
    let custom = false
    if (props.renderNode && data) {
      ctx.save()
      // 把原点搬到卡片左上角，回调里从 (0, 0) 起按设计稿坐标画
      ctx.translate(node.x, node.y)
      const result = props.renderNode({
        ctx,
        node: data,
        zone: 'node',
        layout: node,
        width: nodeWidth,
        height: nodeHeight,
        scale: s,
        hovered: isHover,
        active: isActive,
        theme: p,
        radius: NODE_RADIUS,
      })
      ctx.restore()
      custom = result === false
    }

    if (!custom) {
      let cardFill: string | CanvasGradient = p.nodeFill
      if (isActive || isHover) {
        cardFill = p.nodeFillHover
      } else if (showDetail) {
        const gradient = ctx.createLinearGradient(0, box.y, 0, box.y + nodeHeight)
        gradient.addColorStop(0, p.nodeFill)
        gradient.addColorStop(1, p.nodeFillEnd)
        cardFill = gradient
      }

      // 卡片底：缩放到看得清文字时才加投影（几千个节点时不值得）
      ctx.save()
      if (showDetail) {
        ctx.shadowColor = 'rgba(15, 23, 42, 0.10)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetY = 3
      }
      ctx.fillStyle = cardFill
      roundRectPath(ctx, box, NODE_RADIUS)
      ctx.fill()
      ctx.restore()

      // 卡片边：选中给一圈强调色柔光，悬停只提亮描边
      if (isActive) {
        ctx.save()
        ctx.shadowColor = p.accent
        ctx.shadowBlur = 14
        ctx.strokeStyle = p.nodeBorderActive
        ctx.lineWidth = 2 / s
        roundRectPath(ctx, box, NODE_RADIUS)
        ctx.stroke()
        ctx.restore()
      } else {
        ctx.strokeStyle = isHover ? p.nodeBorderActive : p.nodeBorder
        ctx.lineWidth = (isHover ? 1.6 : 1) / s
        roundRectPath(ctx, box, NODE_RADIUS)
        ctx.stroke()
      }

      if (showName) {
        const radius = showDetail ? AVATAR_RADIUS : AVATAR_RADIUS_SMALL
        const avatarX = node.x + PADDING_X + radius
        const avatarY = node.y + nodeHeight / 2
        // 头像外描一圈卡片底色，和卡片拉开层次
        ctx.beginPath()
        ctx.arc(avatarX, avatarY, radius + 1.5, 0, Math.PI * 2)
        ctx.fillStyle = cardFill
        ctx.fill()
        drawAvatar(ctx, data, avatarX, avatarY, radius, p)

        const textLeft = node.x + PADDING_X + radius * 2 + TEXT_GAP
        const maxWidth = node.x + nodeWidth - PADDING_X - textLeft
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = p.text
        ctx.font = `600 ${showDetail ? 15 : 13}px ${CANVAS_FONT_FAMILY}`
        ctx.fillText(
          ellipsize(ctx, data?.name ?? '', maxWidth),
          textLeft,
          showDetail ? node.y + nodeHeight / 2 - 10 : node.y + nodeHeight / 2,
        )
        if (showDetail && data?.title) {
          ctx.fillStyle = p.textMuted
          ctx.font = `400 12px ${CANVAS_FONT_FAMILY}`
          ctx.fillText(
            ellipsize(ctx, data.title, maxWidth),
            textLeft,
            node.y + nodeHeight / 2 + 12,
          )
        }
      }
    }

    // 拖拽改层级的视觉：被拖的卡片画虚线框，落点目标画强调色柔光描边
    if (highlight && dragId.value === node.id) {
      ctx.save()
      ctx.setLineDash([6 / s, 4 / s])
      ctx.strokeStyle = p.accent
      ctx.lineWidth = 2 / s
      roundRectPath(ctx, box, NODE_RADIUS)
      ctx.stroke()
      ctx.restore()
    }
    if (highlight && dragTargetId.value === node.id) {
      ctx.save()
      ctx.shadowColor = p.accent
      ctx.shadowBlur = 16
      ctx.strokeStyle = p.accent
      ctx.lineWidth = 2.6 / s
      roundRectPath(ctx, box, NODE_RADIUS)
      ctx.stroke()
      ctx.restore()
    }

    if (showDetail && node.childCount > 0) drawBadge(ctx, node, p)
    if (showToggle && node.childCount > 0) drawToggle(ctx, node, isCollapsed, p, s)
  }
}

/** 拖拽引导线：从被拖卡片中心指向指针；落点合法用强调色，否则用连线色 */
const drawDragLink = (ctx: CanvasRenderingContext2D, p: Palette, s: number) => {
  const pointer = dragPointer.value
  const source = dragId.value ? layout.value.index.get(dragId.value) : undefined
  if (!pointer || !source) return
  const valid = Boolean(dragTargetId.value)
  const color = valid ? p.accent : p.edge
  ctx.save()
  ctx.setLineDash([6 / s, 5 / s])
  ctx.lineWidth = 2 / s
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.moveTo(source.x + source.boxWidth / 2, source.y + props.nodeHeight / 2)
  ctx.lineTo(pointer.x, pointer.y)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(pointer.x, pointer.y, 3 / s, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

const paint = () => {
  const canvas = canvasRef.value
  const p = palette.value
  if (!canvas || !p || !width.value || !height.value) return

  const dpr = window.devicePixelRatio || 1
  const bitmapWidth = Math.max(1, Math.round(width.value * dpr))
  const bitmapHeight = Math.max(1, Math.round(height.value * dpr))
  if (canvas.width !== bitmapWidth) canvas.width = bitmapWidth
  if (canvas.height !== bitmapHeight) canvas.height = bitmapHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width.value, height.value)

  const background = resolveCssColor(rootRef.value, props.background || 'transparent', 'background-color')
  if (!isTransparent(background)) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width.value, height.value)
  }

  const s = scale.value
  ctx.save()
  ctx.translate(offsetX.value, offsetY.value)
  ctx.scale(s, s)
  const view: ViewRect = {
    x: -offsetX.value / s,
    y: -offsetY.value / s,
    width: width.value / s,
    height: height.value / s,
  }
  drawEdges(ctx, view, p, s)
  drawNodes(ctx, view, p, s)
  if (dragId.value) drawDragLink(ctx, p, s)
  ctx.restore()
}

/* ---------------------------------------------------------- 命中测试 */

const hitTest = (screenX: number, screenY: number): JeOrgChartHit | null => {
  const s = scale.value
  const wx = (screenX - offsetX.value) / s
  const wy = (screenY - offsetY.value) / s
  const { nodeWidth, nodeHeight } = props
  const nodes = layout.value.nodes

  // 折叠按钮压在卡片下沿外侧，先判它。热区直径 44px（移动端触控下限），
  // 但压在卡片本体上的那一块要让位给卡片：只有落在视觉按钮那一小圈才判成 toggle。
  for (const node of nodes) {
    if (node.childCount === 0) continue
    const cx = node.x + node.boxWidth / 2
    const visualCy = node.y + nodeHeight
    const hitCy = visualCy + TOGGLE_HIT_OFFSET_Y
    const dx = wx - cx
    const dy = wy - hitCy
    if (dx * dx + dy * dy > TOGGLE_HIT_RADIUS ** 2) continue
    const inCard =
      wx >= node.x && wx <= node.x + nodeWidth && wy >= node.y && wy <= node.y + nodeHeight
    if (inCard) {
      const vx = wx - cx
      const vy = wy - visualCy
      if (vx * vx + vy * vy > (TOGGLE_RADIUS + 2) ** 2) continue
    }
    return { id: node.id, zone: 'toggle' }
  }
  for (const node of nodes) {
    if (wx >= node.x && wx <= node.x + nodeWidth && wy >= node.y && wy <= node.y + nodeHeight) {
      return { id: node.id, zone: 'body' }
    }
  }
  // 配偶卡并排在主卡右侧，横向与主卡不重叠
  const spouseW = spouseWidth.value
  for (const node of nodes) {
    const spouses = spousesOf(nodeMap.value.get(node.id))
    if (!spouses.length || wy < node.y || wy > node.y + nodeHeight) continue
    for (let i = 0; i < spouses.length; i += 1) {
      const x = spouseX(node, i)
      if (wx >= x && wx <= x + spouseW) return { id: node.id, zone: 'spouse', spouseIndex: i }
    }
  }
  return null
}

/* ------------------------------------------------------ 撤销 / 重做 */

/**
 * 历史栈（仅 `undoable` 时记录）：`past` 从旧到新、`future` 从近到远，
 * `present` 是「组件最近抛出的那份数据」—— 用它区分「宿主把我们抛出的数组写回」
 * 与「宿主换了整份新数据」（后者要作废历史）。
 */
const historyPast = ref<JeOrgChartNode[][]>([])
const historyFuture = ref<JeOrgChartNode[][]>([])
const historyPresent = ref<JeOrgChartNode[] | null>(null)

/** 宿主换数据（不是我们刚抛出去的那份）→ 历史作废 */
watch(
  () => props.nodes,
  (list) => {
    if (list && list === historyPresent.value) return
    historyPresent.value = list ?? []
    historyPast.value = []
    historyFuture.value = []
  },
  { immediate: true },
)

/**
 * 「由组件自身发起」的数据变更统一走这里：先记一份历史（`undoable` 时），再抛 update:nodes。
 * 组件是受控的，只抛数据、不改 props —— 宿主把新数组写回后布局自动重算。
 */
const commitNodes = (next: JeOrgChartNode[]) => {
  if (props.undoable) {
    const before = historyPresent.value ?? (props.nodes ?? [])
    historyPast.value = [...historyPast.value, before]
    historyFuture.value = []
  }
  // 不论有没有开历史都缓存「组件最近抛出的那份」：宿主把新数组写回要等一个 tick，
  // 连续同步变更（如循环调用 addChild）若仍读 props 会读到过期数据、后一次覆盖前一次
  historyPresent.value = next
  emit('update:nodes', next)
}

/**
 * 变更的基准数组：优先用组件自己刚抛出的那份（`historyPresent`），其次才退回 props。
 * 这样同一次 tick 里连续调用 addChild / removeNode 也不会互相覆盖。
 */
const currentNodeList = (): JeOrgChartNode[] => historyPresent.value ?? (props.nodes ?? [])

const canUndo = computed(() => props.undoable && historyPast.value.length > 0)
const canRedo = computed(() => props.undoable && historyFuture.value.length > 0)

watch([canUndo, canRedo], ([u, r]) => emit('history-change', u, r))

/** 撤销上一次变更（需 undoable）；成功返回 true，没有可撤销的返回 false */
const undo = (): boolean => {
  if (!canUndo.value) return false
  const past = [...historyPast.value]
  const previous = past.pop() as JeOrgChartNode[]
  const current = historyPresent.value ?? (props.nodes ?? [])
  historyPast.value = past
  historyFuture.value = [current, ...historyFuture.value]
  historyPresent.value = previous
  emit('update:nodes', previous)
  return true
}

/** 重做被撤销的变更（需 undoable）；成功返回 true，没有可重做的返回 false */
const redo = (): boolean => {
  if (!canRedo.value) return false
  const [next, ...rest] = historyFuture.value
  const current = historyPresent.value ?? (props.nodes ?? [])
  historyFuture.value = rest
  historyPast.value = [...historyPast.value, current]
  historyPresent.value = next
  emit('update:nodes', next)
  return true
}

/** 清空历史（需 undoable），之后 canUndo / canRedo 都为 false */
const clearHistory = () => {
  historyPast.value = []
  historyFuture.value = []
  historyPresent.value = props.nodes ?? []
}

/* -------------------------------------------------------- 拖拽改层级 */

/**
 * 解析落点：只有落在「另一张主卡」上才算合法，且要排掉三种无效情形 ——
 * 拖到自己身上、拖回原位（父没变）、拖到自己的后代（会成环）。
 * 沿目标的祖先链上溯即可判环：遇到被拖节点就说明目标在它子树里。
 */
const resolveDragTarget = (sourceId: string, hit: JeOrgChartHit | null): string | null => {
  if (!hit || hit.zone !== 'body') return null
  const targetId = hit.id
  if (targetId === sourceId) return null
  if (targetId === (parentMap.value.get(sourceId) ?? null)) return null
  let cursor: string | null = parentMap.value.get(targetId) ?? null
  const seen = new Set<string>()
  while (cursor && !seen.has(cursor)) {
    if (cursor === sourceId) return null
    seen.add(cursor)
    cursor = parentMap.value.get(cursor) ?? null
  }
  return targetId
}

const resetDrag = () => {
  dragCandidate = null
  dragId.value = null
  dragTargetId.value = null
  dragPointer.value = null
}

/**
 * 提交拖拽：按 id 换掉那一条的 parentId（其余保持原引用），抛出 node-move（语义）与
 * update:nodes（数据契约）。落到折叠节点上时顺手把目标展开，否则移过去的节点会立刻被藏起来。
 */
const commitDrag = () => {
  const sourceId = dragId.value
  const targetId = dragTargetId.value
  if (!sourceId || !targetId) return
  const source = nodeMap.value.get(sourceId)
  if (!source || !nodeMap.value.has(targetId)) return
  const oldParentId = parentMap.value.get(sourceId) ?? null
  emit('node-move', source, oldParentId, targetId)
  commitNodes(
    currentNodeList().map((item) =>
      String(item.id) === sourceId ? { ...item, parentId: targetId } : item,
    ),
  )
  if (collapsed.value.has(targetId)) {
    const next = new Set(collapsed.value)
    next.delete(targetId)
    collapsed.value = next
  }
}

/* ------------------------------------------------------------ 交互 */

const pointers = new Map<number, { x: number; y: number }>()
let panStart: { x: number; y: number; offsetX: number; offsetY: number } | null = null
let pinchStart:
  | { distance: number; scale: number; centerX: number; centerY: number; offsetX: number; offsetY: number }
  | null = null
let moved = false

const onWheel = (event: WheelEvent) => {
  event.preventDefault()
  const local = localOf(event.clientX, event.clientY)
  zoomAt(local.x, local.y, scale.value * Math.exp(-event.deltaY * 0.0015))
}

const onPointerDown = (event: PointerEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.setPointerCapture?.(event.pointerId)
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  moved = false

  // 第二指落下：任何拖拽 / 平移都让位给双指缩放
  if (pointers.size >= 2) {
    resetDrag()
    const [a, b] = [...pointers.values()]
    const center = localOf((a.x + b.x) / 2, (a.y + b.y) / 2)
    pinchStart = {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      scale: scale.value,
      centerX: center.x,
      centerY: center.y,
      offsetX: offsetX.value,
      offsetY: offsetY.value,
    }
    panStart = null
    panning.value = true
    return
  }

  // 单指落在可拖拽节点的主卡上 → 本次手势交给拖拽（不平移画布）；
  // 越过 DRAG_THRESHOLD 才算拖拽，否则按点击处理（弹详情 / 编辑浮层）
  dragCandidate = null
  if (props.draggable) {
    const local = localOf(event.clientX, event.clientY)
    const hit = hitTest(local.x, local.y)
    if (hit && hit.zone === 'body') {
      dragCandidate = { id: hit.id, x: event.clientX, y: event.clientY }
      panStart = null
      pinchStart = null
      return
    }
  }

  panStart = { x: event.clientX, y: event.clientY, offsetX: offsetX.value, offsetY: offsetY.value }
  pinchStart = null
  panning.value = true
}

const onPointerMove = (event: PointerEvent) => {
  if (!pointers.has(event.pointerId)) {
    const local = localOf(event.clientX, event.clientY)
    const hit = hitTest(local.x, local.y)
    const next = hit?.id ?? null
    if (hoverId.value !== next) hoverId.value = next
    const nextSpouse = hit?.zone === 'spouse' ? hit.spouseIndex ?? null : null
    if (hoverSpouseIndex.value !== nextSpouse) hoverSpouseIndex.value = nextSpouse
    const nextZone = hit?.zone ?? null
    if (hoverZone.value !== nextZone) hoverZone.value = nextZone
    return
  }

  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (pointers.size >= 2 && pinchStart) {
    const [a, b] = [...pointers.values()]
    const distance = Math.hypot(a.x - b.x, a.y - b.y)
    const next = clamp(
      pinchStart.scale * (distance / Math.max(1, pinchStart.distance)),
      props.minScale,
      props.maxScale,
    )
    const k = next / pinchStart.scale
    const center = localOf((a.x + b.x) / 2, (a.y + b.y) / 2)
    offsetX.value = center.x + (pinchStart.offsetX - pinchStart.centerX) * k
    offsetY.value = center.y + (pinchStart.offsetY - pinchStart.centerY) * k
    scale.value = next
    moved = true
    return
  }

  // 拖拽改层级：位移过阈值才真正进入拖拽态，避免「点一下」被当成拖拽
  if (dragCandidate && !dragId.value) {
    const dx = event.clientX - dragCandidate.x
    const dy = event.clientY - dragCandidate.y
    if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
      dragId.value = dragCandidate.id
      closePopup()
    }
  }
  if (dragId.value) {
    const local = localOf(event.clientX, event.clientY)
    dragPointer.value = local
    dragTargetId.value = resolveDragTarget(dragId.value, hitTest(local.x, local.y))
    moved = true
    return
  }

  if (panStart) {
    const dx = event.clientX - panStart.x
    const dy = event.clientY - panStart.y
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true
    offsetX.value = panStart.offsetX + dx
    offsetY.value = panStart.offsetY + dy
  }
}

const onPointerUp = (event: PointerEvent) => {
  const wasSingle = pointers.size === 1
  pointers.delete(event.pointerId)

  if (pointers.size === 0) {
    // 拖拽改层级：松手即提交（落点非法则什么都不做）
    if (dragId.value) {
      commitDrag()
      resetDrag()
      panStart = null
      pinchStart = null
      moved = false
      panning.value = false
      return
    }
    if (wasSingle && !moved) {
      const local = localOf(event.clientX, event.clientY)
      const hit = hitTest(local.x, local.y)
      if (!hit) {
        activeId.value = null
        activeSpouseIndex.value = null
      } else if (hit.zone === 'toggle') {
        toggleNode(hit.id)
      } else if (hit.zone === 'spouse') {
        const host = nodeMap.value.get(hit.id)
        const index = hit.spouseIndex ?? 0
        const spouse = spousesOf(host)[index]
        if (host && spouse) {
          // 选中这张配偶卡：有 spouse-popup 插槽就弹详情，否则只高亮 + 抛事件
          activeId.value = hit.id
          activeSpouseIndex.value = index
          emit('spouse-click', spouse, host, event)
        }
      } else {
        const data = nodeMap.value.get(hit.id)
        if (data) {
          activeId.value = hit.id
          activeSpouseIndex.value = null
          emit('node-click', data, event)
        }
      }
    }
    dragCandidate = null
    panStart = null
    pinchStart = null
    moved = false
    panning.value = false
    return
  }

  if (pointers.size === 1) {
    const [remaining] = [...pointers.values()]
    panStart = { x: remaining.x, y: remaining.y, offsetX: offsetX.value, offsetY: offsetY.value }
    pinchStart = null
  }
}

/** 手势被系统打断（如触摸转滚动）：不提交拖拽，只清理状态 */
const onPointerCancel = (event: PointerEvent) => {
  pointers.delete(event.pointerId)
  if (pointers.size > 0) return
  resetDrag()
  panStart = null
  pinchStart = null
  moved = false
  panning.value = false
}

const onPointerLeave = () => {
  if (pointers.size !== 0) return
  if (hoverId.value !== null) hoverId.value = null
  if (hoverSpouseIndex.value !== null) hoverSpouseIndex.value = null
  if (hoverZone.value !== null) hoverZone.value = null
}

const cursor = computed(() => {
  if (dragId.value || panning.value) return 'grabbing'
  if (!hoverId.value) return 'grab'
  // 可拖拽的主卡给「移动」光标，与画布平移的抓手区分开
  return props.draggable && hoverZone.value === 'body' ? 'move' : 'pointer'
})

/* ---------------------------------------------------------- 详情浮层 */

/**
 * 详情浮层：跟着选中的目标走（`activeId` + `activeSpouseIndex`），用 DOM 插槽承载内容 ——
 * 主卡走 `node-popup`、配偶卡走 `spouse-popup`。位置按视口矩阵换算成屏幕坐标，
 * 默认浮在卡片上方、带一个指向卡片的箭头；上方放不下时自动翻到下方。
 * 缩放 / 平移时同步跟随，点画布空白处收起。
 */
const popupRef = ref<HTMLElement | null>(null)
const popupSize = ref({ width: 0, height: 0 })

/** 选中目标所属的主卡数据（选中配偶卡时，这里仍是它所属的主卡） */
const popupHost = computed(() =>
  activeId.value ? nodeMap.value.get(activeId.value) ?? null : null,
)

const popupZone = computed<'node' | 'spouse'>(() =>
  activeSpouseIndex.value === null ? 'node' : 'spouse',
)

/** 选中的配偶数据；选的是主卡时为 null */
const popupSpouse = computed<JeOrgChartSpouse | null>(() => {
  const index = activeSpouseIndex.value
  const host = popupHost.value
  if (index === null || !host) return null
  return spousesOf(host)[index] ?? null
})

/** 目标有效、且对应插槽存在（或已开启内置编辑 / 增删）时才渲染浮层 */
const popupVisible = computed(() => {
  if (!popupHost.value) return false
  if (popupZone.value === 'spouse') return Boolean(slots['spouse-popup']) && Boolean(popupSpouse.value)
  // 主卡：给了 node-popup 插槽就以插槽为准，否则任意一个内置操作开启时退到内置浮层
  return (
    Boolean(slots['node-popup']) ||
    props.editable ||
    props.addable ||
    props.removable
  )
})

/** 锚点矩形（世界坐标）：配偶卡锚到那张配偶卡，主卡锚到「主卡 + 各配偶卡」整块 */
const popupAnchor = computed(() => {
  const id = activeId.value
  const node = id ? layout.value.index.get(id) : undefined
  if (!node) return null
  const index = activeSpouseIndex.value
  if (index !== null) {
    return {
      x: spouseX(node, index),
      y: node.y,
      width: spouseWidth.value,
      height: props.nodeHeight,
    }
  }
  return { x: node.x, y: node.y, width: node.boxWidth, height: props.nodeHeight }
})

const popupPlacement = computed(() => {
  const anchor = popupAnchor.value
  if (!anchor || !width.value || !height.value) return null
  const s = scale.value
  const w = popupSize.value.width
  const h = popupSize.value.height
  const anchorX = (anchor.x + anchor.width / 2) * s + offsetX.value
  const topY = anchor.y * s + offsetY.value
  const bottomY = (anchor.y + anchor.height) * s + offsetY.value
  const below = topY - POPUP_GAP - h < POPUP_MARGIN
  const top = below ? bottomY + POPUP_GAP : topY - POPUP_GAP - h
  const maxLeft = Math.max(POPUP_MARGIN, width.value - w - POPUP_MARGIN)
  const left = clamp(anchorX - w / 2, POPUP_MARGIN, maxLeft)
  return { left, top, below, arrowX: clamp(anchorX - left, 16, Math.max(16, w - 16)) }
})

const popupStyle = computed(() => {
  const p = popupPlacement.value
  return p ? { left: `${p.left}px`, top: `${p.top}px` } : { display: 'none' }
})

const popupArrowStyle = computed(() => {
  const p = popupPlacement.value
  return p ? { left: `${p.arrowX}px` } : {}
})

const closePopup = () => {
  activeId.value = null
  activeSpouseIndex.value = null
}

/**
 * 浮层打开时按 Esc 收起（演示页提示的「取消或按 Esc 关闭」即此）。
 * 监听挂在 window 上而不是根节点：点卡片时焦点落在 body（canvas 不可聚焦），
 * 事件不会冒泡进浮层，只有全局监听能收到；此时若正处于删除二次确认态，
 * closePopup() 会连带把确认态一并复位。
 */
const onPopupKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && popupVisible.value) closePopup()
}

/* ---------------------------------------------------------- 表单编辑 */

/**
 * 内置编辑浮层的草稿：只在「开启编辑 + 选中主卡」这个源变化时同步一次当前值。
 * 用户输入期间不受影响（源没变），只有父级换掉了选中节点对象、或重新选中时才会覆盖草稿。
 */
const draftName = ref('')
const draftTitle = ref('')

watch(
  () => (props.editable && popupZone.value === 'node' ? popupHost.value : null),
  (host) => {
    draftName.value = host ? String(host.name ?? '') : ''
    draftTitle.value = host ? String(host.title ?? '') : ''
  },
  { immediate: true },
)

/** 主标题必填，空串不允许保存 */
const canSaveEdit = computed(() => draftName.value.trim().length > 0)

/**
 * 保存：按 id 替换那一条（其余条目保持原引用），抛出**新的完整数组**。
 * 受控组件只抛数据、不改 props —— nodes 由父级（v-model:nodes）更新，
 * 布局随之自动重算；视口与折叠状态保持不变（见首屏初始化那段 watch）。
 */
const saveEdit = () => {
  const host = popupHost.value
  if (!props.editable || !host || !canSaveEdit.value) return
  const id = String(host.id)
  const name = draftName.value.trim()
  const title = draftTitle.value.trim()
  commitNodes(
    currentNodeList().map((item) =>
      String(item.id) === id ? { ...item, name, title: title || undefined } : item,
    ),
  )
  closePopup()
}

// 浮层内容是插槽给的，尺寸只能等渲染完再量；换目标（含换到同一主卡的另一位配偶）就重新量一次
watch([activeId, activeSpouseIndex], async () => {
  if (!popupVisible.value) {
    popupSize.value = { width: 0, height: 0 }
    return
  }
  await nextTick()
  const el = popupRef.value
  if (el) popupSize.value = { width: el.offsetWidth, height: el.offsetHeight }
})

/* ---------------------------------------------------------- 增删节点 */

/** 浮层里「删除」按钮的二次确认态：非 null 时浮层显示确认条 */
const confirmRemoveId = ref<string | null>(null)
/** 确认条上显示的下级数量（不含被点的节点自身） */
const pendingRemoveCount = ref(0)

/** 切换选中目标就退出二次确认态，避免确认条挂到另一个节点上 */
watch([activeId, activeSpouseIndex], () => {
  if (confirmRemoveId.value !== null) {
    confirmRemoveId.value = null
    pendingRemoveCount.value = 0
  }
})

/** 新节点 id 的自增段（与时间戳一起保证本地唯一） */
let newNodeSeed = 0

/** 生成一个不与既有节点冲突的字符串 id —— 组件不知道宿主的 id 规则，统一发字符串 */
const genNodeId = (): string => {
  let id = ''
  do {
    newNodeSeed += 1
    id = `node-${Date.now().toString(36)}-${newNodeSeed}`
  } while (currentNodeList().some((item) => String(item.id) === id))
  return id
}

/** 收集某节点及其全部下级（先序）；成环数据也不会死循环 */
const collectSubtree = (rootId: string): JeOrgChartNode[] => {
  const byId = new Map<string, JeOrgChartNode>()
  const children = new Map<string, string[]>()
  for (const node of currentNodeList()) {
    const id = String(node.id)
    if (!byId.has(id)) byId.set(id, node)
    const parent = node.parentId == null ? null : String(node.parentId)
    if (!parent) continue
    const bucket = children.get(parent)
    if (bucket) bucket.push(id)
    else children.set(parent, [id])
  }
  const out: JeOrgChartNode[] = []
  const seen = new Set<string>()
  const stack = [rootId]
  while (stack.length) {
    const id = stack.pop() as string
    if (seen.has(id)) continue
    seen.add(id)
    const node = byId.get(id)
    if (node) out.push(node)
    for (const childId of children.get(id) ?? []) stack.push(childId)
  }
  return out
}

/**
 * 在指定节点下追加一个下级（需 addable）：id 自动生成、名称取当前语言包的「新节点」，
 * 抛 node-add（语义）与 update:nodes（数据契约）；顺手展开父节点并把新节点设为选中，
 * 内置浮层会立刻跟到新卡片上、可继续改名。
 */
const addChild = (parentId: string | number): boolean => {
  if (!props.addable) return false
  const pid = String(parentId)
  if (!currentNodeList().some((item) => String(item.id) === pid)) return false
  const node: JeOrgChartNode = { id: genNodeId(), parentId: pid, name: t('orgChart.newNode') }
  emit('node-add', node, pid)
  commitNodes([...currentNodeList(), node])
  if (collapsed.value.has(pid)) {
    const next = new Set(collapsed.value)
    next.delete(pid)
    collapsed.value = next
  }
  activeId.value = String(node.id)
  activeSpouseIndex.value = null
  return true
}

/**
 * 删除某节点**及其全部下级**（需 removable）：抛 node-remove（被删的整棵子树）与 update:nodes。
 * 内置浮层里点「删除」会先进入二次确认态，确认后才调到这里。
 */
const removeNode = (id: string | number): boolean => {
  if (!props.removable) return false
  const target = String(id)
  const removed = collectSubtree(target)
  const origin = removed[0]
  if (!origin) return false
  const removedIds = new Set(removed.map((item) => String(item.id)))
  emit('node-remove', removed, origin)
  commitNodes(currentNodeList().filter((item) => !removedIds.has(String(item.id))))
  closePopup()
  return true
}

/** 浮层内「添加下级」按钮 */
const onAddChild = () => {
  const host = popupHost.value
  if (host) addChild(host.id)
}

/** 浮层内「删除」按钮：先进二次确认态 */
const askRemove = () => {
  const host = popupHost.value
  if (!props.removable || !host) return
  const id = String(host.id)
  confirmRemoveId.value = id
  pendingRemoveCount.value = Math.max(0, collectSubtree(id).length - 1)
}

const cancelRemove = () => {
  confirmRemoveId.value = null
  pendingRemoveCount.value = 0
}

const doRemove = () => {
  const id = confirmRemoveId.value
  cancelRemove()
  if (id) removeNode(id)
}

/* ------------------------------------------------------------ 图片 */

const syncImages = async () => {
  const wanted = new Set<string>()
  for (const node of nodeMap.value.values()) {
    if (node.avatar) wanted.add(node.avatar)
    for (const spouse of spousesOf(node)) if (spouse.avatar) wanted.add(spouse.avatar)
  }
  if (!wanted.size) return

  const token = (loadToken += 1)
  const pending = [...wanted].filter((src) => !images.has(src))
  if (!pending.length) return

  const loaded = await Promise.all(
    pending.map(async (src) => [src, await loadImage(src)] as const),
  )
  if (token !== loadToken) return
  for (const [src, image] of loaded) images.set(src, image)
  imageVersion.value += 1
}

/* ------------------------------------------------------------ 导出 */

const renderToCanvas = (options: JeOrgChartExportOptions = {}) => {
  const p = palette.value
  const l = layout.value
  if (!p || !l.width || !l.height) return null

  const requested = Number.isFinite(options.scale) ? Math.max(0.05, options.scale as number) : 1
  const ratio = Math.min(
    requested,
    MAX_EXPORT_SIZE / l.width,
    MAX_EXPORT_SIZE / l.height,
  )
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(l.width * ratio))
  canvas.height = Math.max(1, Math.round(l.height * ratio))
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const background = resolveCssColor(
    rootRef.value,
    options.background ?? props.background ?? 'transparent',
    'background-color',
  )
  if (!isTransparent(background)) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.scale(ratio, ratio)
  const view: ViewRect = { x: 0, y: 0, width: l.width, height: l.height }
  drawEdges(ctx, view, p, ratio)
  drawNodes(ctx, view, p, ratio, false)
  return canvas
}

/** 把当前可见内容导出为 dataURL（走独立离屏画布，预览的悬停 / 选中高亮不会被画进去） */
const toDataURL = (options?: JeOrgChartExportOptions): string => {
  const canvas = renderToCanvas(options)
  if (!canvas) return ''
  try {
    return canvas.toDataURL(options?.type ?? 'image/png', options?.quality)
  } catch {
    return ''
  }
}

/** 导出为图片 Blob（适合上传或转 File） */
const toBlob = (options?: JeOrgChartExportOptions): Promise<Blob | null> =>
  new Promise((resolve) => {
    const canvas = renderToCanvas(options)
    if (!canvas) {
      resolve(null)
      return
    }
    canvas.toBlob(
      (blob) => resolve(blob),
      options?.type ?? 'image/png',
      options?.quality,
    )
  })

/** 导出并触发浏览器下载 */
const download = async (filename = 'org-chart.png', options?: JeOrgChartExportOptions) => {
  const blob = await toBlob(options)
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* -------------------------------------------------------------- 定位 */

/**
 * 定位到指定节点：先按 id 精确匹配，再按 name / title 模糊匹配。
 * 会自动展开它到根的整条路径、居中放大并高亮；找不到返回 false。
 */
const locate = (keyword: string | number): boolean => {
  const raw = String(keyword ?? '').trim()
  if (!raw) return false

  let target: JeOrgChartNode | null = null
  for (const node of nodeMap.value.values()) {
    if (String(node.id) === raw) {
      target = node
      break
    }
  }
  if (!target) {
    const lower = raw.toLowerCase()
    for (const node of nodeMap.value.values()) {
      if (`${node.name ?? ''} ${node.title ?? ''}`.toLowerCase().includes(lower)) {
        target = node
        break
      }
    }
  }
  if (!target) return false

  const id = String(target.id)
  expandTo(id)
  activeId.value = id
  activeSpouseIndex.value = null
  emit('locate', target)
  void nextTick(() => flyTo(id))
  return true
}

/** 当前可见节点的 id 列表（先序），便于外部统计或断言 */
const getVisibleIds = () => layout.value.nodes.map((node) => node.id)

defineExpose({
  /** 定位到某个节点（id 精确匹配或 name / title 模糊匹配），自动展开祖先并居中高亮 */
  locate,
  /** 展开从根到指定节点 id 的整条路径 */
  expandTo,
  /** 展开全部节点 */
  expandAll,
  /** 折叠到指定层级，缺省 0 即只留根节点 */
  collapseTo,
  /** 把整张图适配进当前视口 */
  fit,
  /** 当前可见节点的 id 列表 */
  getVisibleIds,
  /** 在指定节点下追加一个下级（需 addable），成功返回 true；插槽自定义 UI 时可用 */
  addChild,
  /** 删除某节点及其全部下级（需 removable），成功返回 true；插槽自定义 UI 时可用 */
  removeNode,
  /** 撤销上一次「增删 / 编辑 / 拖拽」（需 undoable）；成功返回 true，没得撤返回 false */
  undo,
  /** 重做被撤销的变更（需 undoable）；成功返回 true，没得重做返回 false */
  redo,
  /** 清空历史（需 undoable），之后 canUndo / canRedo 都为 false */
  clearHistory,
  /** 把当前可见内容导出为 dataURL */
  toDataURL,
  /** 把当前可见内容导出为 Blob */
  toBlob,
  /** 导出并触发下载 */
  download,
})

/* ------------------------------------------------------------ 生命周期 */

let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null

const measure = () => {
  const root = rootRef.value
  if (!root) return
  const first = width.value === 0
  width.value = root.clientWidth
  height.value = root.clientHeight
  if (first) resetView()
}

onMounted(() => {
  window.addEventListener('keydown', onPopupKeydown)
  const root = rootRef.value
  const canvas = canvasRef.value
  if (!root || !canvas) return

  readPalette()
  measure()
  canvas.addEventListener('wheel', onWheel, { passive: false })

  resizeObserver = new ResizeObserver(() => measure())
  resizeObserver.observe(root)

  // 换明暗主题 / 调色板都写 documentElement，跟着重读一次配色
  themeObserver = new MutationObserver(() => readPalette())
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'style'],
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onPopupKeydown)
  canvasRef.value?.removeEventListener('wheel', onWheel)
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  resizeObserver = null
  themeObserver = null
  flyProgress.stop()
})

watch(nodeMap, () => void syncImages(), { immediate: true })

/**
 * 是否已经用「首屏数据」摆好默认折叠与初始视口。
 *
 * 数据（nodes）变化既可能是首屏 / 换数据集，也可能是**编辑**（改姓名这类）。
 * 早先这里每次变化都重跑 applyDefaultCollapse() + resetView()，编辑一次视口就会
 * 跳回初始位置、折叠状态也被重置 —— 所以只在首次拿到非空数据时做一次，
 * 之后的数据变化交给「布局重算 + 重绘」，视口与折叠保持不变。
 */
let viewInitialized = false

watch(
  sources,
  (list) => {
    if (!list.length || viewInitialized) return
    viewInitialized = true
    applyDefaultCollapse()
    void nextTick(() => resetView())
  },
  { immediate: true },
)

watch(layout, (l) => {
  // 折叠后原本选中 / 悬停的节点可能被藏起来，及时清掉
  if (hoverId.value && !l.index.has(hoverId.value)) hoverId.value = null
  if (activeId.value && !l.index.has(activeId.value)) {
    activeId.value = null
    activeSpouseIndex.value = null
  }
})

watch(
  [
    scale,
    offsetX,
    offsetY,
    hoverId,
    hoverSpouseIndex,
    activeId,
    activeSpouseIndex,
    dragId,
    dragTargetId,
    dragPointer,
    collapsed,
    palette,
    imageVersion,
    layout,
    width,
    height,
  ],
  () => paint(),
  { flush: 'post' },
)
</script>

<template>
  <div ref="rootRef" class="je-org-chart" :style="{ cursor }">
    <canvas
      ref="canvasRef"
      class="je-org-chart__canvas"
      role="img"
      :aria-label="label"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @pointerleave="onPointerLeave"
    />
    <div
      v-if="popupVisible"
      ref="popupRef"
      class="je-org-chart__popup"
      :style="popupStyle"
    >
      <span
        class="je-org-chart__popup-arrow"
        :class="popupPlacement?.below ? 'is-up' : 'is-down'"
        :style="popupArrowStyle"
      />
      <!-- 主卡详情浮层：插槽参数 node 是当前节点数据，close 收起浮层 -->
      <slot
        v-if="popupZone === 'node' && slots['node-popup']"
        name="node-popup"
        :node="popupHost"
        :close="closePopup"
      />
      <!-- 内置操作浮层（未提供 node-popup 插槽时生效）：可编辑时是表单，另有增删入口 -->
      <div v-else-if="popupZone === 'node'" class="je-org-chart__editor">
        <template v-if="editable">
          <label class="je-org-chart__field">
            <span class="je-org-chart__label">{{ t('orgChart.name') }}</span>
            <input
              v-model="draftName"
              class="je-org-chart__input"
              type="text"
              maxlength="40"
              @keydown.enter="saveEdit"
            />
          </label>
          <label class="je-org-chart__field">
            <span class="je-org-chart__label">{{ t('orgChart.title') }}</span>
            <input
              v-model="draftTitle"
              class="je-org-chart__input"
              type="text"
              maxlength="40"
              @keydown.enter="saveEdit"
            />
          </label>
        </template>
        <!-- 只开增删、没开编辑时，用一行只读名字给浮层一点上下文 -->
        <div v-else class="je-org-chart__readonly">{{ popupHost?.name }}</div>

        <!-- 删除的二次确认态：替换掉下面的操作行 -->
        <template v-if="confirmRemoveId">
          <p class="je-org-chart__confirm">
            {{
              pendingRemoveCount > 0
                ? t('orgChart.removeConfirm', { count: pendingRemoveCount })
                : t('orgChart.removeConfirmLeaf')
            }}
          </p>
          <div class="je-org-chart__actions">
            <button type="button" class="je-org-chart__btn" @click="cancelRemove">
              {{ t('cancel') }}
            </button>
            <button type="button" class="je-org-chart__btn is-danger" @click="doRemove">
              {{ t('confirm') }}
            </button>
          </div>
        </template>
        <div v-else class="je-org-chart__actions is-split">
          <div class="je-org-chart__action-group">
            <button
              v-if="addable"
              type="button"
              class="je-org-chart__btn"
              @click="onAddChild"
            >
              {{ t('orgChart.addChild') }}
            </button>
            <button
              v-if="removable"
              type="button"
              class="je-org-chart__btn is-danger-ghost"
              @click="askRemove"
            >
              {{ t('orgChart.remove') }}
            </button>
          </div>
          <div v-if="editable" class="je-org-chart__action-group">
            <button type="button" class="je-org-chart__btn" @click="closePopup">
              {{ t('cancel') }}
            </button>
            <button
              type="button"
              class="je-org-chart__btn is-primary"
              :disabled="!canSaveEdit"
              @click="saveEdit"
            >
              {{ t('confirm') }}
            </button>
          </div>
        </div>
      </div>
      <!-- 配偶详情浮层：插槽参数 spouse 是配偶数据、host 是配偶所属的主卡、close 收起浮层 -->
      <slot v-else name="spouse-popup" :spouse="popupSpouse" :host="popupHost" :close="closePopup" />
    </div>
  </div>
</template>

<style scoped>
.je-org-chart {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.je-org-chart__canvas {
  display: block;
  width: 100%;
  height: 100%;
  /* 图表是自成一体的缩放 / 平移画布，交给指针事件全权处理手势 */
  touch-action: none;
}

.je-org-chart__popup {
  position: absolute;
  z-index: 2;
  width: max-content;
  max-width: 288px;
  padding: 12px 14px;
  background: var(--je-org-popup-bg, var(--je-surface));
  border: 1px solid var(--je-org-popup-border, var(--je-border-color));
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
  font-size: 13px;
  color: var(--je-text);
}

.je-org-chart__popup-arrow {
  position: absolute;
  width: 0;
  height: 0;
  margin-left: -8px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
}

/* 浮层在卡片下方 → 箭头朝上；在卡片上方 → 箭头朝下。三角形与浮层同色，像个对话气泡 */
.je-org-chart__popup-arrow.is-up {
  top: -7px;
  border-bottom: 8px solid var(--je-org-popup-bg, var(--je-surface));
}

.je-org-chart__popup-arrow.is-down {
  bottom: -7px;
  border-top: 8px solid var(--je-org-popup-bg, var(--je-surface));
}

/* ------------------------------------------------ 内置编辑浮层 */

.je-org-chart__editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 208px;
}

.je-org-chart__field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.je-org-chart__label {
  flex: 0 0 auto;
  width: 42px;
  font-size: 12px;
  color: var(--je-text-muted);
}

.je-org-chart__input {
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  height: 28px;
  padding: 0 8px;
  font: inherit;
  font-size: 13px;
  color: var(--je-text);
  background: var(--je-bg-page-from, transparent);
  border: 1px solid var(--je-border-color);
  border-radius: 6px;
  outline: none;
  /* 根节点为了拖拽平移禁用了文本选择，输入框里必须放开 */
  user-select: text;
  -webkit-user-select: text;
}

.je-org-chart__input:focus {
  border-color: var(--je-primary);
}

.je-org-chart__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 2px;
}

/* 增删入口在左、确定取消在右；挤不下时换行而不是溢出浮层 */
.je-org-chart__actions.is-split {
  flex-wrap: wrap;
  justify-content: space-between;
}

.je-org-chart__action-group {
  display: flex;
  gap: 8px;
}

/* 只开增删、没开编辑时那行只读名字 */
.je-org-chart__readonly {
  max-width: 240px;
  overflow: hidden;
  font-weight: 600;
  color: var(--je-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-org-chart__confirm {
  margin: 0;
  line-height: 1.5;
  color: var(--je-text);
}

.je-org-chart__btn {
  height: 28px;
  padding: 0 12px;
  font: inherit;
  font-size: 13px;
  color: var(--je-text);
  background: var(--je-surface);
  border: 1px solid var(--je-border-color);
  border-radius: 6px;
  cursor: pointer;
}

/* 彩色表面上的文字走 on-color（见主题铁律），不要退回 --je-text */
.je-org-chart__btn.is-primary {
  color: var(--je-text-on-color);
  background: var(--je-primary);
  border-color: var(--je-primary);
}

/* 删除确认的实体危险按钮 */
.je-org-chart__btn.is-danger {
  color: var(--je-text-on-color);
  background: var(--je-danger);
  border-color: var(--je-danger);
}

/* 浮层里的「删除」入口是描边危险色 —— 底色仍是普通表面，文字直接用 danger 即可 */
.je-org-chart__btn.is-danger-ghost {
  color: var(--je-danger);
  border-color: color-mix(in srgb, var(--je-danger) 45%, transparent);
}

.je-org-chart__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
