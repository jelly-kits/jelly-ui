<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import JeButton from '../JeButton/JeButton.vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import type { JeButtonType } from '../JeButton/types'
import type { JeIconName } from '../JeIcon/icons'

defineOptions({ name: 'JeSubmitBar' })

const props = withDefaults(
  defineProps<{
    /** 合计金额 */
    price?: number
    /** 金额左侧文字，如「合计：」 */
    label?: string
    /** 货币符号 */
    currency?: string
    /** 金额保留的小数位数 */
    decimalLength?: number
    /** 上方提示文案 */
    tip?: string
    /** 提示文案前的图标 */
    tipIcon?: JeIconName
    /** 提交按钮文案 */
    buttonText?: string
    /** 提交按钮的语义类型 */
    buttonType?: JeButtonType
    /** 加载中文案 */
    loadingText?: string
    disabled?: boolean
    loading?: boolean
    /** 固定在视口底部 */
    fixed?: boolean
    /** fixed 时用占位元素撑住原来的高度，避免遮住页面底部内容 */
    placeholder?: boolean
    /** 底部预留安全区 */
    safeAreaInsetBottom?: boolean
    /** 顶部 1px 分隔线 */
    border?: boolean
    /** fixed 时的层级 */
    zIndex?: number
  }>(),
  {
    price: undefined,
    label: '',
    currency: '¥',
    decimalLength: 2,
    tip: '',
    tipIcon: undefined,
    buttonText: '提交订单',
    buttonType: 'primary',
    loadingText: '提交中...',
    disabled: false,
    loading: false,
    fixed: false,
    placeholder: true,
    safeAreaInsetBottom: true,
    border: true,
    zIndex: 100,
  },
)

const emit = defineEmits<{
  /** 点击提交按钮（loading / disabled 时不触发） */
  submit: []
}>()

const barRef = ref<HTMLElement | null>(null)
const barHeight = ref(0)

const formattedPrice = computed(() =>
  props.price === undefined ? '' : props.price.toFixed(props.decimalLength),
)

const rootStyle = computed(() => ({
  '--je-submit-bar-height': `${barHeight.value}px`,
  '--je-submit-bar-safe-bottom': props.safeAreaInsetBottom
    ? 'env(safe-area-inset-bottom, 0px)'
    : '0px',
  ...(props.fixed ? { '--je-submit-bar-z': String(props.zIndex) } : {}),
}))

const onSubmit = () => {
  if (props.disabled || props.loading) return
  emit('submit')
}

let observer: ResizeObserver | null = null
const syncHeight = () => {
  barHeight.value = barRef.value?.offsetHeight ?? 0
}

onMounted(() => {
  syncHeight()
  if (typeof ResizeObserver !== 'undefined' && barRef.value) {
    observer = new ResizeObserver(syncHeight)
    observer.observe(barRef.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div class="je-submit-bar" :style="rootStyle">
    <div
      ref="barRef"
      class="je-submit-bar__inner"
      :class="{ 'is-fixed': fixed, 'has-border': border }"
    >
      <div v-if="tip || $slots.tip" class="je-submit-bar__tip">
        <JeIcon v-if="tipIcon" :name="tipIcon" :size="14" />
        <span><slot name="tip">{{ tip }}</slot></span>
      </div>

      <div class="je-submit-bar__bar">
        <div class="je-submit-bar__content">
          <slot>
            <span v-if="label" class="je-submit-bar__label">{{ label }}</span>
            <span v-if="formattedPrice" class="je-submit-bar__price">
              <span class="je-submit-bar__currency">{{ currency }}</span>{{ formattedPrice }}
            </span>
          </slot>
        </div>

        <div class="je-submit-bar__action">
          <JeButton
            :type="buttonType"
            :disabled="disabled"
            :loading="loading"
            @click="onSubmit"
          >
            {{ loading ? loadingText : buttonText }}
          </JeButton>
        </div>
      </div>
    </div>

    <div v-if="fixed && placeholder" class="je-submit-bar__placeholder" />
  </div>
</template>

<style scoped>
.je-submit-bar {
  font-family: inherit;
  --je-submit-bar-height: 0px;
  --je-submit-bar-safe-bottom: 0px;
}

.je-submit-bar__inner {
  box-sizing: border-box;
  color: var(--je-text);
  background: var(--je-popup);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  padding-bottom: var(--je-submit-bar-safe-bottom);
}

.je-submit-bar__inner.has-border {
  border-top: var(--je-border);
}

.je-submit-bar__inner.is-fixed {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--je-submit-bar-z, 100);
}

.je-submit-bar__tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--je-warning);
  background: color-mix(in srgb, var(--je-warning) 12%, transparent);
}

.je-submit-bar__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  min-height: 52px;
  padding: 8px 16px;
}

.je-submit-bar__content {
  display: flex;
  flex: 1 1 auto;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
  font-size: 14px;
  color: var(--je-text-muted);
}

.je-submit-bar__price {
  font-size: 20px;
  font-weight: 700;
  color: var(--je-danger);
  font-variant-numeric: tabular-nums;
}

.je-submit-bar__currency {
  font-size: 14px;
}

.je-submit-bar__action {
  flex-shrink: 0;
}

.je-submit-bar__placeholder {
  height: var(--je-submit-bar-height);
}

@media (max-width: 768px) {
  .je-submit-bar__bar {
    gap: 10px;
    padding: 8px 14px;
  }

  .je-submit-bar__action {
    min-width: 120px;
  }
}
</style>
