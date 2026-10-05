<script setup lang="ts">
import { computed, provide } from 'vue'
import { getJellyConfig, type JeTeleportTarget } from '../../core/globalConfig'
import { provideJeLocale, type JeLocaleInput } from '../JeLocale/types'
import { jeConfigKey, type JeConfigSize } from './types'

defineOptions({ name: 'JeConfigProvider' })

const props = defineProps<{
  /** 子树默认组件尺寸；应用级缺省用 configureJelly({ size }) */
  size?: JeConfigSize
  /** 主题变量覆盖，键可带或不带 --je- 前缀 */
  theme?: Record<string, string>
  /** 语言包，传语言名或部分覆盖对象 */
  locale?: JeLocaleInput
  /** 浮层默认挂载节点，选择器或元素；缺省时挂在 body */
  teleportTo?: JeTeleportTarget
}>()

/*
 * 自身没传就落到应用级单例（configureJelly），再缺省才是内置值。
 * 所以 size 不能给 'default' 作 prop 默认值 —— 那会把全局配置整个压死。
 */
provide(jeConfigKey, {
  size: computed(() => props.size ?? getJellyConfig().size ?? 'default'),
  teleportTo: computed(() => props.teleportTo ?? getJellyConfig().teleportTo),
})

provideJeLocale(() => props.locale)

/** 键名兼容 `primary` 与 `--je-primary` 两种写法 */
const themeStyle = computed(() => {
  const style: Record<string, string> = {}
  for (const [key, value] of Object.entries(props.theme ?? {})) {
    style[key.startsWith('--') ? key : `--je-${key}`] = value
  }
  return style
})
</script>

<template>
  <div class="je-config-provider" :style="themeStyle">
    <slot />
  </div>
</template>

<style scoped>
/* 只做变量下发、不参与布局，避免破坏外层 flex / grid */
.je-config-provider {
  display: contents;
}
</style>
