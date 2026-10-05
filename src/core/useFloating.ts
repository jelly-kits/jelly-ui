import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export type JeSide = 'top' | 'bottom' | 'left' | 'right'
export type JeAlign = 'start' | 'center' | 'end'
/** 方位：`bottom` / `bottom-start` / `bottom-end` */
export type JePlacementValue = JeSide | `${JeSide}-start` | `${JeSide}-end`

export interface UseFloatingOptions {
  /** 触发元素 */
  reference: Ref<HTMLElement | null>
  /** 浮层元素（需要常驻 DOM，收起时用 visibility 而不是 v-if，否则量不到尺寸） */
  floating: Ref<HTMLElement | null>
  /** 是否展开，收起时不做任何计算 */
  open: Ref<boolean>
  /** 期望方位 */
  placement?: () => JePlacementValue
  /** 浮层与触发元素的间距 */
  offset?: number
  /** 距视口边缘的最小留白 */
  padding?: number
  /** 空间不足时是否自动翻到对侧 */
  flip?: boolean
}

export interface UseFloatingReturn {
  /** 浮层左上角坐标（position: fixed 下使用） */
  x: Ref<number>
  y: Ref<number>
  /** 翻转后实际采用的方位 */
  placement: Ref<JePlacementValue>
  /** 箭头在浮层交叉轴上的偏移（px） */
  arrowCross: Ref<number>
  /** 强制重新测量 / 定位 */
  update: () => void
}

/**
 * 锚点浮层定位：把浮层钉在触发元素旁边，并做翻转与边界收缩。
 *
 * 浮层用 position: fixed 定位，于是可以 Teleport 到 body、不受祖先 overflow 裁切。
 */
export function useFloating(options: UseFloatingOptions): UseFloatingReturn {
  const { reference, floating, open } = options
  const offset = options.offset ?? 8
  const padding = options.padding ?? 8
  const flip = options.flip ?? true

  const x = ref(0)
  const y = ref(0)
  const placement = ref<JePlacementValue>(options.placement?.() ?? 'bottom')
  const arrowCross = ref(0)

  let observer: ResizeObserver | null = null

  const update = () => {
    const refEl = reference.value
    const floatEl = floating.value
    if (!refEl || !floatEl || !open.value) return

    const fw = floatEl.offsetWidth
    const fh = floatEl.offsetHeight
    // 还没完成布局时先跳过，等下一帧
    if (fw === 0 || fh === 0) return

    const rect = refEl.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    const parsed = (options.placement?.() ?? 'bottom').split('-')
    let side = parsed[0] as JeSide
    const align = (parsed[1] as JeAlign | undefined) ?? 'center'

    const space: Record<JeSide, number> = {
      top: rect.top,
      bottom: vh - rect.bottom,
      left: rect.left,
      right: vw - rect.right,
    }
    const need: Record<JeSide, number> = {
      top: fh + offset,
      bottom: fh + offset,
      left: fw + offset,
      right: fw + offset,
    }
    const opposite: Record<JeSide, JeSide> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    }

    if (flip) {
      const other = opposite[side]
      if (space[side] < need[side] && space[other] >= need[other]) side = other
    }

    let nextX = 0
    let nextY = 0
    let cross = 0

    if (side === 'top' || side === 'bottom') {
      nextY = side === 'top' ? rect.top - fh - offset : rect.bottom + offset
      const center = rect.left + rect.width / 2
      if (align === 'start') nextX = rect.left
      else if (align === 'end') nextX = rect.right - fw
      else nextX = center - fw / 2
      cross = center - nextX
    } else {
      nextX = side === 'left' ? rect.left - fw - offset : rect.right + offset
      const middle = rect.top + rect.height / 2
      if (align === 'start') nextY = rect.top
      else if (align === 'end') nextY = rect.bottom - fh
      else nextY = middle - fh / 2
      cross = middle - nextY
    }

    // 边界收缩：贴住视口但不越界
    const maxX = Math.max(padding, vw - fw - padding)
    const maxY = Math.max(padding, vh - fh - padding)
    nextX = Math.min(Math.max(nextX, padding), maxX)
    nextY = Math.min(Math.max(nextY, padding), maxY)

    // 收缩后箭头要跟着挪，否则会指偏
    if (side === 'top' || side === 'bottom') {
      cross = Math.min(Math.max(cross, 14), fw - 14)
    } else {
      cross = Math.min(Math.max(cross, 14), fh - 14)
    }

    x.value = Math.round(nextX)
    y.value = Math.round(nextY)
    arrowCross.value = Math.round(cross)
    placement.value = (align === 'center' ? side : `${side}-${align}`) as JePlacementValue
  }

  const schedule = () => nextTick(update)

  watch(open, (value) => {
    if (value) schedule()
  })

  watch(reference, () => {
    if (open.value) schedule()
  })

  onMounted(() => {
    window.addEventListener('resize', update)
    // 捕获阶段才能听到任意滚动容器的滚动
    window.addEventListener('scroll', update, true)
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(update)
      watch(
        floating,
        (el) => {
          observer?.disconnect()
          if (el) observer?.observe(el)
        },
        { immediate: true },
      )
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', update)
    window.removeEventListener('scroll', update, true)
    observer?.disconnect()
  })

  return { x, y, placement, arrowCross, update }
}
