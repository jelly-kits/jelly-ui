/**
 * 果冻弹簧动画内核。
 *
 * 积分公式与参考实现（test.html 里的 springAnimate）完全一致：
 *
 *   acceleration = (to - current) * stiffness
 *   velocity     = (velocity + acceleration) * damping
 *   current     += velocity
 *
 * 唯一的改动是「按固定步长推进」：参考实现每个 rAF 帧积分一次，
 * 而一帧的时长取决于屏幕刷新率。这里固定每步 1/60 秒，再按真实流逝
 * 时间补步数，于是 60Hz 下与参考实现逐帧等价，120Hz 下也不会快一倍。
 */

export interface SpringConfig {
  /** 刚度：越大越快到位 */
  stiffness: number
  /** 阻尼：越小回弹越夸张 */
  damping: number
  /** 静止判定阈值，默认 0.001 */
  precision?: number
}

/** 固定积分步长（毫秒），对应 60Hz 的一帧 */
const STEP = 1000 / 60

/** 单帧最多补的步数，避免标签页切回前台时一次性冲过头 */
const MAX_STEPS_PER_FRAME = 8

const DEFAULT_PRECISION = 0.001

/** 取消动画，可安全重复调用 */
export type SpringCancel = () => void

/**
 * 把数值从 `from` 弹性过渡到 `to`。
 *
 * @param onUpdate 每帧回调，`done` 为 true 时表示已静止在终点（该次回调后不再触发）
 * @returns 取消函数
 */
export function springTo(
  from: number,
  to: number,
  config: SpringConfig,
  onUpdate: (value: number, done: boolean) => void,
): SpringCancel {
  const { stiffness, damping } = config
  const precision = config.precision ?? DEFAULT_PRECISION

  // 非浏览器环境（SSR / 单测）直接落到终点
  if (typeof requestAnimationFrame !== 'function') {
    onUpdate(to, true)
    return () => {}
  }

  let current = from
  let velocity = 0
  let rafId = 0
  let lastTime = -1
  // 首帧就先积分一步，与参考实现的逐帧行为对齐
  let accumulator = STEP
  let cancelled = false

  const integrate = () => {
    const acceleration = (to - current) * stiffness
    velocity = (velocity + acceleration) * damping
    current += velocity
  }

  const frame = (time: number) => {
    if (cancelled) return

    if (lastTime < 0) lastTime = time
    accumulator += Math.min(time - lastTime, STEP * MAX_STEPS_PER_FRAME)
    lastTime = time

    let steps = 0
    while (accumulator >= STEP && steps < MAX_STEPS_PER_FRAME) {
      integrate()
      accumulator -= STEP
      steps += 1
    }
    // 追不上的部分直接丢弃，防止欠账越滚越多
    if (accumulator >= STEP) accumulator = 0

    if (Math.abs(velocity) < precision && Math.abs(to - current) < precision) {
      onUpdate(to, true)
      return
    }

    onUpdate(current, false)
    rafId = requestAnimationFrame(frame)
  }

  rafId = requestAnimationFrame(frame)

  return () => {
    cancelled = true
    cancelAnimationFrame(rafId)
  }
}