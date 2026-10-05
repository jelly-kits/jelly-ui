<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeCell, JeCellGroup, JeIcon, JeSwitch } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const notify = ref(true)
const clicks = ref(0)
</script>

<template>
  <DemoPage
    title="Cell 列表项"
    description="移动端最基础的列表单元，一行承载标题、说明、右侧内容与箭头；CellGroup 负责分组与分割线。"
  >
    <DemoBlock title="基础用法" description="title 是主标题，value 是右侧内容，label 是标题下方的说明。">
      <je-cell-group>
        <je-cell title="单元格" value="内容" />
        <je-cell title="单元格" value="内容" label="带描述信息的单元格" />
        <je-cell title="单元格" is-link />
      </je-cell-group>
    </DemoBlock>

    <DemoBlock title="图标与跳转" description="icon 放在标题左侧，is-link 在右侧补一个箭头表示整行可点。">
      <je-cell-group>
        <je-cell title="我的订单" icon="list" is-link />
        <je-cell title="收货地址" icon="map-pin" value="上海市浦东新区" is-link />
        <je-cell
          title="消息通知"
          icon="bell"
          :value="`已点击 ${clicks} 次`"
          is-link
          @click="clicks += 1"
        />
      </je-cell-group>
    </DemoBlock>

    <DemoBlock title="表单场景" description="inset 让分组左右内缩成卡片；required 在标题前加必填星号；center 让内容垂直居中。">
      <je-cell-group title="账户资料" inset>
        <je-cell title="昵称" value="Jelly" is-link />
        <je-cell title="手机号" value="138****8888" required is-link />
        <je-cell title="接收推送" center>
          <je-switch v-model="notify" />
        </je-cell>
      </je-cell-group>
    </DemoBlock>

    <DemoBlock title="自定义插槽" description="title / label / value / icon / right-icon 插槽都可以替换成任意内容。">
      <je-cell-group title="自定义内容" inset>
        <je-cell title="默认插槽" label="右侧区域可放任意内容">
          <je-icon name="star" :size="18" />
        </je-cell>
        <je-cell center>
          <template #title>完全自定义标题</template>
          <template #value>
            <je-button size="small">操作</je-button>
          </template>
        </je-cell>
      </je-cell-group>
    </DemoBlock>
  </DemoPage>
</template>
