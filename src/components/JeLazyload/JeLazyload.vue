<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({ name: 'JeLazyload' })

const props = withDefaults(
  defineProps<{
    /** 图片地址 */
    src?: string
    /** 替代文本 */
    alt?: string
    /** 距离视口多远开始加载，对应 IntersectionObserver 的 rootMargin */
    rootMargin?: string
    /** eager 表示不做懒加载，直接渲染 */
    loading?: 'lazy' | 'eager'
    /** 占位图地址，也可以直接用 placeholder 插槽 */
    placeholder?: string
    /** 加载失败时的兜底图地址 */
    error?: string
    /** 容器宽度，数字按 px 处理 */
    width?: number | string
    /** 容器高度，数字按 px 处理 */
    height?: number | string
    /** 图片填充方式 */
    objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  }>(),
  {
    src: '',
    alt: '',
    rootMargin: '0px',
    loading: 'lazy',
    placeholder: '',
    error: '',
    width: undefined,
    height: undefined,
    objectFit: 'cover',
  },
)

const emit = defineEmits<{
  /** 图片加载完成 */
  load: [event: Event]
  /** 图片加载失败（有兜底图时会触发两次：原图失败一次、兜底图再失败一次） */
  error: [event: Event]
}>()

const rootRef = ref<HTMLElement | null>(null)
const inView = ref(false)
const failed = ref(false)
const usingFallback = ref(false)

/** eager 或已经进入视口才渲染真实图片，其余时间展示占位内容 */
const shouldRender = computed(() => props.loading === 'eager' || inView.value)

const currentSrc = computed(() =>
  usingFallback.value && props.error ? props.error : props.src,
)

const toPx = (value: number | string) => (typeof value === 'number' ? `${value}px` : value)

const rootStyle = computed(() => ({
  ...(props.width === undefined ? {} : { width: toPx(props.width) }),
  ...(props.height === undefined ? {} : { height: toPx(props.height) }),
  '--je-lazyload-fit': props.objectFit,
}))

const onLoad = (event: Event) => {
  failed.value = false
  emit('load', event)
}

const onError = (event: Event) => {
  if (props.error && !usingFallback.value) {
    usingFallback.value = true
    emit('error', event)
    return
  }
  failed.value = true
  emit('error', event)
}

let observer: IntersectionObserver | null = null

const disconnect = () => {
  observer?.disconnect()
  observer = null
}

onMounted(() => {
  if (props.loading === 'eager' || typeof IntersectionObserver === 'undefined') {
    inView.value = true
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        inView.value = true
        disconnect()
      }
    },
    { rootMargin: props.rootMargin },
  )
  if (rootRef.value) observer.observe(rootRef.value)
})

onBeforeUnmount(disconnect)
</script>

<template>
  <div ref="rootRef" class="je-lazyload" :class="{ 'is-error': failed }" :style="rootStyle">
    <img
      v-if="shouldRender"
      class="je-lazyload__img"
      :src="currentSrc"
      :alt="alt"
      @load="onLoad"
      @error="onError"
    >
    <slot v-else name="placeholder">
      <img v-if="placeholder" class="je-lazyload__img" :src="placeholder" :alt="alt">
      <span v-else class="je-lazyload__skeleton" aria-hidden="true" />
    </slot>

    <span v-if="failed && !error" class="je-lazyload__error">加载失败</span>
  </div>
</template>

<style scoped>
.je-lazyload {
  position: relative;
  display: block;
  overflow: hidden;
  box-sizing: border-box;
  font-family: inherit;
  background: var(--je-surface);
  border-radius: var(--je-radius-sm);
}

.je-lazyload__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: var(--je-lazyload-fit, cover);
}

.je-lazyload__skeleton {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 80px;
  background: linear-gradient(
    100deg,
    var(--je-surface) 30%,
    var(--je-surface-hover) 50%,
    var(--je-surface) 70%
  );
  background-size: 300% 100%;
  animation: je-lazyload-shimmer 1.4s ease-in-out infinite;
}

.je-lazyload__error {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--je-text-faint);
  text-align: center;
  background: rgba(0, 0, 0, 0.45);
}

@keyframes je-lazyload-shimmer {
  from {
    background-position: 150% 0;
  }
  to {
    background-position: -50% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-lazyload__skeleton {
    animation: none;
  }
}
</style>
