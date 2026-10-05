<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeSearch } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const keyword = ref('')
const log = ref('暂无')

const onSearch = (value: string) => {
  log.value = `搜索：${value || '（空）'}`
}

const cancelValue = ref('')
const cancelVisible = ref(false)

const onCancel = () => {
  cancelValue.value = ''
  cancelVisible.value = false
}
</script>

<template>
  <DemoPage
    title="Search 搜索框"
    description="移动端搜索输入框，带前置放大镜、内容清除与可选取消按钮，回车或点击右侧搜索区触发 search。"
  >
    <DemoBlock title="基础用法" description="v-model 绑定关键字，回车或点右侧放大镜触发 search 事件。">
      <je-search v-model="keyword" placeholder="搜索商品、订单" @search="onSearch" />
      <p class="hint">当前关键字：{{ keyword || '（空）' }}</p>
    </DemoBlock>

    <DemoBlock title="方形与自定义背景" description="shape 控制外形，background 传任意 CSS 颜色即可换底色。">
      <je-search v-model="keyword" shape="square" placeholder="圆角方形" />
      <je-search v-model="keyword" background="rgba(64, 158, 255, 0.12)" placeholder="自定义底色" />
    </DemoBlock>

    <DemoBlock title="带取消按钮" description="移动端常见的「点击搜索框再出现取消」交互由调用方控制显隐。">
      <div class="row">
        <je-search
          v-model="cancelValue"
          :show-cancel="cancelVisible"
          placeholder="点右侧按钮切换取消"
          @search="onSearch"
          @cancel="onCancel"
        />
        <je-button size="small" variant="ghost" @click="cancelVisible = !cancelVisible">
          {{ cancelVisible ? '隐藏取消' : '显示取消' }}
        </je-button>
      </div>
      <p class="hint">{{ log }}</p>
    </DemoBlock>

    <DemoBlock title="禁用状态">
      <je-search v-model="keyword" disabled placeholder="禁用后不可输入" />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.row .je-search {
  flex: 1;
}
</style>
