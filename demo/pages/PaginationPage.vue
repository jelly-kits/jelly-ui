<script setup lang="ts">
import { ref } from 'vue'
import { JePagination } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const basic = ref(1)
const full = ref(6)
const fullSize = ref(20)
const simple = ref(3)
const disabled = ref(1)
</script>

<template>
  <DemoPage
    title="Pagination 分页"
    description="当数据量过多时使用分页来拆解数据。支持 total / sizes / prev / pager / next / jumper 自由组合，窄屏会自动精简为上一页 / 当前页 / 下一页。"
  >
    <DemoBlock title="基础用法">
      <je-pagination v-model="basic" :total="85" />
      <p class="state">当前第 {{ basic }} 页</p>
    </DemoBlock>

    <DemoBlock title="完整布局" description="layout 支持 total / sizes / prev / pager / next / jumper。">
      <je-pagination
        v-model="full"
        v-model:page-size="fullSize"
        :total="420"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
      <p class="state">第 {{ full }} 页 · 每页 {{ fullSize }} 条</p>
    </DemoBlock>

    <DemoBlock title="尺寸与折叠">
      <je-pagination v-model="simple" :total="300" small background />
      <je-pagination v-model="full" :total="1000" :pager-count="5" />
    </DemoBlock>

    <DemoBlock
      title="禁用与单页隐藏"
      description="窄屏下会精简为上一页 / 当前页 / 下一页，热区保持不小于 44px。"
    >
      <je-pagination v-model="disabled" :total="120" disabled />
      <je-pagination :total="8" hide-on-single-page />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>
