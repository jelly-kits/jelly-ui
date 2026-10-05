<script setup lang="ts">
import { computed } from 'vue'
import { jeBrandIconNames, jeIcons, type JeIconName } from './icons'

defineOptions({ name: 'JeIcon' })

const props = withDefaults(
  defineProps<{
    name: JeIconName
    /** 图标尺寸，数字按 px 处理 */
    size?: number | string
    /** 是否旋转（加载态） */
    spin?: boolean
    /** 用填充代替描边（评分星星等） */
    filled?: boolean
  }>(),
  { size: 16, spin: false, filled: false },
)

/**
 * 品牌 logo 的路径本身就是实心轮廓，再描边会把图形糊掉，
 * 所以它们恒为「只填充」，与 filled 属性的效果一致。
 */
const isBrand = computed(() => jeBrandIconNames.has(props.name))
const solid = computed(() => props.filled || isBrand.value)

const paths = computed(() => jeIcons[props.name] ?? [])
</script>

<template>
  <svg
    class="je-icon"
    :class="{ 'is-spinning': spin }"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    :fill="solid ? 'currentColor' : 'none'"
    :stroke="isBrand ? 'none' : 'currentColor'"
    :stroke-width="isBrand ? 0 : 2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(d, index) in paths" :key="index" :d="d" />
  </svg>
</template>

<style scoped>
.je-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: -0.15em;
}

.je-icon.is-spinning {
  animation: je-icon-spin 0.9s linear infinite;
}

@keyframes je-icon-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-icon.is-spinning {
    animation: none;
  }
}
</style>