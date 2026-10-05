<script setup lang="ts">
import { ref } from 'vue'
import { JeDropdownMenu, JeDropdownMenuItem, type JeDropdownOption } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const sort = ref<string | number | undefined>(undefined)
const city = ref<string | number | undefined>(undefined)
const price = ref<string | number | undefined>(undefined)
const brands = ref<(string | number)[]>(['apple'])
const notice = ref<string | number | undefined>(undefined)

const sortOptions: JeDropdownOption[] = [
  { value: 'default', text: '综合排序', title: '综合排序', icon: 'list' },
  { value: 'sales', text: '销量优先', title: '销量优先', icon: 'chart' },
  { value: 'price', text: '价格最低', title: '价格最低', icon: 'tag' },
  { value: 'new', text: '最新上架', title: '最新上架', icon: 'zap' },
]

const cityOptions: JeDropdownOption[] = [
  { value: 'beijing', text: '北京', icon: 'map-pin' },
  { value: 'shanghai', text: '上海', icon: 'map-pin' },
  { value: 'guangzhou', text: '广州', icon: 'map-pin' },
  { value: 'shenzhen', text: '深圳', icon: 'map-pin' },
  { value: 'hangzhou', text: '杭州', icon: 'map-pin' },
]

const priceOptions: JeDropdownOption[] = [
  { value: '0-50', text: '50 元以下', tip: '共 128 件' },
  { value: '50-100', text: '50 - 100 元', tip: '共 96 件' },
  { value: '100-200', text: '100 - 200 元', tip: '共 42 件' },
  { value: '200+', text: '200 元以上', tip: '暂不支持筛选', disabled: true },
]

const brandOptions: JeDropdownOption[] = [
  { value: 'apple', text: 'Apple', tip: '现货' },
  { value: 'xiaomi', text: '小米', tip: '现货' },
  { value: 'huawei', text: '华为', tip: '预售' },
  { value: 'oppo', text: 'OPPO', disabled: true },
]

const noticeOptions: JeDropdownOption[] = [
  { value: 'all', text: '全部通知' },
  { value: 'sale', text: '促销活动' },
  { value: 'system', text: '系统消息' },
]
</script>

<template>
  <DemoPage
    title="DropdownMenu 下拉筛选菜单"
    description="电商筛选栏形态的下拉菜单：条目栏等分排布，面板铺满整条菜单宽度，支持遮罩、点击外部收起与上下两个展开方向。"
  >
    <DemoBlock
      title="单列筛选"
      description="每个条目用 v-model 双向绑定选中值；选项带 title 时会把选中值回填到条目栏并高亮，点选项自动收起。"
    >
      <je-dropdown-menu>
        <je-dropdown-menu-item v-model="sort" title="排序" :options="sortOptions" />
      </je-dropdown-menu>
      <p class="state">当前排序：{{ sort ?? '未选择' }}</p>
    </DemoBlock>

    <DemoBlock
      title="禁用项与补充说明"
      description="option.tip 在选项右侧显示灰色小字；option.disabled 的选项不可点选。"
    >
      <je-dropdown-menu>
        <je-dropdown-menu-item v-model="price" title="价格区间" :options="priceOptions" />
        <je-dropdown-menu-item v-model="city" title="城市" :options="cityOptions" />
      </je-dropdown-menu>
      <p class="state">价格：{{ price ?? '未选择' }} · 城市：{{ city ?? '未选择' }}</p>
    </DemoBlock>

    <DemoBlock
      title="多选"
      description="multiple 打开后 modelValue 为数组，条目栏固定显示 title，可连续勾选多个品牌。"
    >
      <je-dropdown-menu>
        <je-dropdown-menu-item v-model="brands" title="品牌（多选）" :options="brandOptions" multiple />
      </je-dropdown-menu>
      <p class="state">已选品牌：{{ brands.length ? brands.join('、') : '未选择' }}</p>
    </DemoBlock>

    <DemoBlock
      title="向上展开"
      description="direction=&quot;up&quot; 时面板从条目栏上方弹出，适合放在页面底部附近的筛选栏。"
    >
      <div class="up-scope">
        <je-dropdown-menu direction="up">
          <je-dropdown-menu-item v-model="notice" title="通知类型" :options="noticeOptions" />
        </je-dropdown-menu>
      </div>
      <p class="state">通知类型：{{ notice ?? '未选择' }}</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}

/* 给向上展开预留出上方的空间，面板才好露出来 */
.up-scope {
  padding-top: 120px;
}
</style>