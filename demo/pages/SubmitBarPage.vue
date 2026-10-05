<script setup lang="ts">
import { ref } from 'vue'
import { JeSubmitBar } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const price = ref(128.5)
const submitting = ref(false)
const lastSubmit = ref('暂无')
const fixed = ref(false)

const onSubmit = () => {
  lastSubmit.value = `已提交，金额 ¥${price.value.toFixed(2)}`
}

const submitWithLoading = () => {
  submitting.value = true
  window.setTimeout(() => {
    submitting.value = false
    onSubmit()
  }, 1200)
}
</script>

<template>
  <DemoPage
    title="SubmitBar 提交栏"
    description="电商下单页底部的合计与提交栏，可固定在视口底部并自动预留安全区。"
  >
    <DemoBlock title="基础用法" description="显示合计金额与提交按钮，按钮复用 Button 的类型与 loading 能力。">
      <div class="box">
        <je-submit-bar :price="price" label="合计：" button-text="提交订单" @submit="onSubmit" />
      </div>
      <p class="hint">{{ lastSubmit }}</p>
    </DemoBlock>

    <DemoBlock title="带上方提示" description="tip 会在金额行上方显示一条浅色提示，通常用于运费说明。">
      <div class="box">
        <je-submit-bar
          :price="price"
          label="合计："
          tip="满 99 元包邮，偏远地区除外"
          tip-icon="bell"
          button-text="去结算"
        />
      </div>
    </DemoBlock>

    <DemoBlock title="提交中" description="loading 时按钮进入加载态且不可重复点击。">
      <div class="box">
        <je-submit-bar
          :price="price"
          label="合计："
          :loading="submitting"
          loading-text="提交中..."
          @submit="submitWithLoading"
        />
      </div>
    </DemoBlock>

    <DemoBlock title="固定在视口底部" description="fixed 打开后固定在底部，并用占位元素撑住原高度避免遮挡内容。">
      <div class="toolbar">
        <je-submit-bar
          v-if="!fixed"
          :price="price"
          label="合计："
          button-text="固定到底部"
          @submit="fixed = true"
        />
        <template v-else>
          <je-submit-bar
            :price="price"
            label="合计："
            fixed
            :z-index="900"
            button-text="取消固定"
            @submit="fixed = false"
          />
          <p class="hint">提交栏已固定在窗口底部，点击按钮可取消。</p>
        </template>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.box {
  border: 1px dashed var(--je-border-color);
  border-radius: var(--je-radius);
  padding: 8px;
  background: var(--je-surface);
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.toolbar {
  min-height: 40px;
}
</style>
