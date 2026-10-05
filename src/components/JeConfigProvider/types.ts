import { computed, inject, type ComputedRef, type InjectionKey } from 'vue'
import { getJellyConfig, type JeTeleportTarget } from '../../core/globalConfig'

/** 组件尺寸档位 */
export type JeConfigSize = 'small' | 'default' | 'large'

/** 由 JeConfigProvider 向子树提供的配置（子树级缺省，不是应用级） */
export interface JeConfigContext {
  /** 子树默认尺寸，组件自身传了 size 时以自身为准 */
  size: ComputedRef<JeConfigSize>
  /** 浮层默认挂载节点（选择器或元素），缺省时浮层挂在 body */
  teleportTo: ComputedRef<JeTeleportTarget | undefined>
}

export const jeConfigKey: InjectionKey<JeConfigContext> = Symbol('jeConfig')

/**
 * 回退链的最底层：没有祖先 provide 时读应用级单例（configureJelly 配的）。
 * 单例本身是 shallowRef，所以这里包一层 computed 就能跟着全局配置更新。
 */
const fallback: JeConfigContext = {
  size: computed(() => getJellyConfig().size ?? 'default'),
  teleportTo: computed(() => getJellyConfig().teleportTo),
}

/** 读取全局配置，没有祖先提供时返回缺省配置 */
export function useJeConfig(): JeConfigContext {
  return inject(jeConfigKey, null) ?? fallback
}

/**
 * 解析浮层挂载点，回退链：
 * 组件自身 prop → 祖先 JeConfigProvider → configureJelly → 'body'
 *
 * own() 返回 false 表示「就地渲染、不传送」，这是组件级专有的语义
 * （全局那一层不收 false：让整站浮层就地渲染几乎必然是事故）。
 *
 * ⚠️ 用这个组合式的组件，`teleportTo` 的 prop 必须**显式写 `default: undefined`**
 * （`withDefaults(..., { teleportTo: undefined })`），不能省略：
 * `teleportTo?: JeTeleportTarget | false` 会让 @vue/compiler-sfc 推出运行时类型
 * `[String, Boolean]`，而 Vue 对「类型里含 Boolean 且缺省、又没有默认值」的 prop
 * 会布尔转型成 false —— 于是 `false ?? 回退` 直接短路，回退链在组件这一层就断了，
 * 表现为浮层永远就地渲染、ConfigProvider 与 configureJelly 完全失效。
 * 显式写上 default 会关掉这次转型，缺省值才真的是 undefined。
 * 新增浮层组件时照抄这一行即可。
 */
export function useTeleportTarget(
  own: () => JeTeleportTarget | false | undefined,
): ComputedRef<JeTeleportTarget | false> {
  const config = useJeConfig()
  return computed(() => own() ?? config.teleportTo.value ?? 'body')
}
