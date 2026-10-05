<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeInfiniteScroll, JeScrollbar } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const loading = ref(false)
const finished = ref(false)
const list = ref(Array.from({ length: 12 }, (_, index) => index + 1))

const load = () => {
  loading.value = true
  window.setTimeout(() => {
    const start = list.value.length
    if (start >= 36) {
      finished.value = true
    } else {
      list.value = [...list.value, ...Array.from({ length: 12 }, (_, index) => start + index + 1)]
    }
    loading.value = false
  }, 900)
}

const reset = () => {
  list.value = Array.from({ length: 12 }, (_, index) => index + 1)
  finished.value = false
}

const errorLoading = ref(false)
const error = ref(false)

const loadWithError = () => {
  errorLoading.value = true
  error.value = false
  window.setTimeout(() => {
    errorLoading.value = false
    error.value = true
  }, 800)
}
</script>

<template>
  <DemoPage
    title="InfiniteScroll 无限滚动"
    description="滚动到容器底部附近时自动触发 load，配合 loading / finished / error 三个状态展示底部提示。"
  >
    <DemoBlock title="基础用法" description="向下滚动到底部会自动加载下一页，加载满 36 条后停止。">
      <je-scrollbar class="is-scope" :height="240">
        <je-infinite-scroll :loading="loading" :finished="finished" @load="load">
          <p v-for="n in list" :key="n" class="is-scope__line">第 {{ n }} 条记录</p>
        </je-infinite-scroll>
      </je-scrollbar>
      <div class="toolbar">
        <je-button size="small" variant="ghost" @click="reset">重置列表</je-button>
      </div>
    </DemoBlock>

    <DemoBlock title="加载失败与重试" description="error 为 true 时点击底部状态区会再次触发 load。">
      <je-scrollbar class="is-scope" :height="240">
        <je-infinite-scroll :loading="errorLoading" :error="error" @load="loadWithError">
          <p v-for="n in 12" :key="n" class="is-scope__line">第 {{ n }} 条记录</p>
        </je-infinite-scroll>
      </je-scrollbar>
    </DemoBlock>

    <DemoBlock title="已全部加载" description="finished 为 true 后显示结束文案，并不再触发任何加载。">
      <je-scrollbar class="is-scope" :height="240">
        <je-infinite-scroll finished>
          <p v-for="n in 4" :key="n" class="is-scope__line">第 {{ n }} 条记录</p>
        </je-infinite-scroll>
      </je-scrollbar>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.is-scope {
  background: var(--je-popup);
  border: var(--je-border);
  border-radius: var(--je-radius);
}

.is-scope__line {
  margin: 0;
  padding: 14px 16px;
  font-size: 14px;
  color: var(--je-text);
  border-bottom: var(--je-border);
}

.toolbar {
  margin-top: 16px;
}
</style>
