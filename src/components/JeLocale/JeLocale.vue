<script setup lang="ts">
import { provideJeLocale, type JeLocaleInput } from './types'

defineOptions({ name: 'JeLocale', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** 语言名（'zh-CN' / 'en-US'）或部分覆盖的语言包对象 */
    locale?: JeLocaleInput
  }>(),
  { locale: undefined },
)

provideJeLocale(() => props.locale)
</script>

<template>
  <slot />
</template>
