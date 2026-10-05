<script setup lang="ts">
import { computed, useId } from 'vue'
import type { JeTeleportTarget } from '../../core/globalConfig'
import { useTeleportTarget } from '../JeConfigProvider/types'

defineOptions({ name: 'JeLoading' })

const props = withDefaults(
  defineProps<{
    /** 是否显示加载遮罩 */
    loading?: boolean
    /** 转圈下方的提示文案 */
    text?: string
    /** 全屏：遮罩传送到 body 并覆盖整个视口 */
    fullscreen?: boolean
    /** 覆盖遮罩底色，留空使用默认半透明黑 */
    background?: string
    /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
    teleportTo?: JeTeleportTarget | false
  }>(),
  {
    loading: false,
    text: '',
    fullscreen: false,
    background: '',
    teleportTo: undefined,
  },
)

/** 浮层挂载点；fullscreen 为假时本来就不传送，这里只管全屏那一路 */
const teleportTarget = useTeleportTarget(() => props.teleportTo)

const uid = useId()
const gradientId = `je-loading-grad-${uid}`

/** 仅在显式传入 background 时覆盖默认底色 */
const maskStyle = computed(() => (props.background ? { background: props.background } : undefined))
</script>

<template>
  <div class="je-loading">
    <slot />

    <Teleport
      :to="teleportTarget === false ? 'body' : teleportTarget"
      :disabled="!fullscreen || teleportTarget === false"
    >
      <div
        v-if="loading"
        class="je-loading__mask"
        :class="{ 'is-fullscreen': fullscreen }"
        :style="maskStyle"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div class="je-loading__spinner">
          <svg class="je-loading__ring" viewBox="0 0 50 50" aria-hidden="true">
            <defs>
              <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
                <stop class="je-loading__stop-start" offset="0%" />
                <stop class="je-loading__stop-end" offset="100%" />
              </linearGradient>
            </defs>
            <circle
              class="je-loading__track"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke-width="5"
            />
            <circle
              class="je-loading__meter"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke-width="5"
              stroke-linecap="round"
              :stroke="`url(#${gradientId})`"
            />
          </svg>
          <span v-if="text" class="je-loading__text">{{ text }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.je-loading {
  position: relative;
}

/* 非全屏：绝对定位覆盖父级；全屏：固定定位覆盖视口 */
.je-loading__mask {
  position: absolute;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  animation: je-loading-in 0.2s ease;
}

.je-loading__mask.is-fullscreen {
  position: fixed;
  padding: env(safe-area-inset-top) env(safe-area-inset-bottom);
}

.je-loading__spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  /* 压在深色遮罩上，文字与图标固定浅色 */
  color: var(--je-text-on-color);
}

.je-loading__ring {
  width: 40px;
  height: 40px;
  animation: je-loading-rotate 1.1s linear infinite;
}

.je-loading__track {
  stroke: color-mix(in srgb, var(--je-primary) 22%, transparent);
}

.je-loading__meter {
  stroke-dasharray: 90;
  stroke-dashoffset: 60;
  animation: je-loading-dash 1.5s ease-in-out infinite;
}

.je-loading__stop-start {
  stop-color: var(--je-primary);
}

.je-loading__stop-end {
  stop-color: var(--je-primary-end);
}

.je-loading__text {
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
  /* 同上：深色遮罩上的文字 */
  color: var(--je-text-on-color);
}

@keyframes je-loading-in {
  from {
    opacity: 0;
  }
}

@keyframes je-loading-rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes je-loading-dash {
  0% {
    stroke-dashoffset: 95;
  }

  50% {
    stroke-dashoffset: 30;
  }

  100% {
    stroke-dashoffset: 95;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-loading__mask,
  .je-loading__ring,
  .je-loading__meter {
    animation: none;
  }
}
</style>
