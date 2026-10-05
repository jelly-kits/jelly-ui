<script setup lang="ts">
import { ref } from 'vue'
import { JePullRefresh } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const loading = ref(false)
const count = ref(3)
const customLoading = ref(false)
const customCount = ref(2)

const refresh = () => {
  window.setTimeout(() => {
    count.value = 3
    loading.value = false
  }, 1200)
}

const refreshCustom = () => {
  window.setTimeout(() => {
    customCount.value += 1
    customLoading.value = false
  }, 1200)
}
</script>

<template>
  <DemoPage
    title="PullRefresh 下拉刷新"
    description="在内容顶部下拉即可触发刷新，下拉过程带阻尼，松手后由弹簧回弹；加载中状态通过 v-model 控制。"
  >
    <DemoBlock
      title="基础用法"
      description="把内容放进插槽，滚动容器已到顶时按住并向下拖动即可（触屏或用鼠标拖动）。"
    >
      <div class="pr-scope">
        <je-pull-refresh v-model="loading" @refresh="refresh">
          <ul class="pr-list">
            <li v-for="n in count" :key="n" class="pr-list__item">
              <span>第 {{ n }} 条记录</span>
              <small>刷新后重置为 3 条</small>
            </li>
          </ul>
        </je-pull-refresh>
      </div>
    </DemoBlock>

    <DemoBlock title="自定义提示文字" description="下拉中、可松手、加载中、成功四种状态都可以改文案。">
      <div class="pr-scope">
        <je-pull-refresh
          v-model="customLoading"
          pulling-text="继续下拉"
          loosing-text="松手刷新"
          loading-text="拼命加载中..."
          success-text="已是最新数据"
          @refresh="refreshCustom"
        >
          <ul class="pr-list">
            <li v-for="n in customCount" :key="n" class="pr-list__item">
              <span>第 {{ n }} 条记录</span>
              <small>每次刷新追加一条</small>
            </li>
          </ul>
        </je-pull-refresh>
      </div>
    </DemoBlock>

    <DemoBlock title="禁用" description="disabled 后不再响应下拉手势，内部滚动仍保持原生行为。">
      <div class="pr-scope">
        <je-pull-refresh disabled>
          <ul class="pr-list">
            <li v-for="n in 3" :key="n" class="pr-list__item">
              <span>第 {{ n }} 条记录</span>
              <small>已禁用下拉刷新</small>
            </li>
          </ul>
        </je-pull-refresh>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.pr-scope {
  height: 260px;
  overflow-y: auto;
  background: var(--je-popup);
  border: var(--je-border);
  border-radius: var(--je-radius);
}

.pr-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.pr-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  font-size: 14px;
  color: var(--je-text);
  border-bottom: var(--je-border);
}

.pr-list__item small {
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>
