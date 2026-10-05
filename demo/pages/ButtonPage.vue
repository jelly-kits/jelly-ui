<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeButtonGroup, JeSpace } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const count = ref(0)
const loading = ref(false)

const submit = () => {
  loading.value = true
  window.setTimeout(() => {
    loading.value = false
  }, 1500)
}
</script>

<template>
  <DemoPage
    title="Button 按钮"
    description="按下时由弹簧内核驱动挤压变形（横向撑开、纵向压扁、轻微倾斜），松手回弹归位。type 决定语义色，plain / dashed / text / link / round / circle 决定形态，block 让按钮撑满容器宽度。"
  >
    <DemoBlock title="基础用法" description="type 是语义类型，与 Text、Toast 的语义色一一对应。">
      <je-space wrap>
        <je-button>主要按钮</je-button>
        <je-button type="default">默认按钮</je-button>
        <je-button type="success">成功按钮</je-button>
        <je-button type="warning">警告按钮</je-button>
        <je-button type="danger">危险按钮</je-button>
        <je-button type="info">信息按钮</je-button>
      </je-space>
    </DemoBlock>

    <DemoBlock
      title="素色与虚线"
      description="plain 是主题色的半透明底 + 描边，dashed 只留一条虚线描边，都跟 type 走。"
    >
      <je-space wrap>
        <je-button plain>主要按钮</je-button>
        <je-button type="success" plain>成功按钮</je-button>
        <je-button type="warning" dashed>警告按钮</je-button>
        <je-button type="danger" dashed>危险按钮</je-button>
      </je-space>
    </DemoBlock>

    <DemoBlock title="文字与链接" description="text 无边框无底色，link 形如超链接、hover 出现下划线。">
      <je-space wrap>
        <je-button text>文字按钮</je-button>
        <je-button type="success" text>文字按钮</je-button>
        <je-button type="danger" text>文字按钮</je-button>
        <je-button link>链接按钮</je-button>
        <je-button type="warning" link>链接按钮</je-button>
      </je-space>
    </DemoBlock>

    <DemoBlock title="圆角与图标" description="round 是胶囊形，circle 是正圆、通常只放一个图标。">
      <je-space wrap align="center">
        <je-button round>胶囊按钮</je-button>
        <je-button type="success" round>胶囊按钮</je-button>
        <je-button icon="search">搜索</je-button>
        <je-button type="danger" icon="trash">删除</je-button>
        <je-button circle icon="plus" />
        <je-button circle type="info" icon="edit" />
      </je-space>
    </DemoBlock>

    <DemoBlock title="尺寸" description="large / default / small 三档，放在按钮组里也可以由组统一下发。">
      <je-space wrap align="center">
        <je-button size="large">大按钮</je-button>
        <je-button>默认按钮</je-button>
        <je-button size="small">小按钮</je-button>
      </je-space>
    </DemoBlock>

    <DemoBlock title="加载与禁用" description="loading 会禁用点击并显示转圈图标，disabled 则整块置灰。">
      <je-space wrap align="center">
        <je-button :loading="loading" @click="submit">
          {{ loading ? '提交中' : '点击提交' }}
        </je-button>
        <je-button type="default" loading>加载中</je-button>
        <je-button disabled>禁用按钮</je-button>
        <je-button type="danger" plain disabled>禁用按钮</je-button>
      </je-space>
    </DemoBlock>

    <DemoBlock
      title="移动端宽按钮"
      description="block 让按钮撑满父容器宽度，配合同级按钮堆叠就是移动端常见的主次操作区。"
    >
      <div class="mobile-frame">
        <je-button block size="large">立即购买</je-button>
        <je-button block type="default" plain>加入购物车</je-button>
        <je-button block type="info" text>稍后再看</je-button>
      </div>
    </DemoBlock>

    <DemoBlock
      title="按钮组"
      description="ButtonGroup 把相邻按钮拼成一体并下发统一的 type / size，子按钮仍可各自覆盖。"
    >
      <je-space wrap align="center">
        <je-button-group>
          <je-button type="default">上一页</je-button>
          <je-button type="default">下一页</je-button>
        </je-button-group>
        <je-button-group type="success" size="small">
          <je-button>左</je-button>
          <je-button>中</je-button>
          <je-button>右</je-button>
        </je-button-group>
        <je-button-group type="info" direction="vertical">
          <je-button>上</je-button>
          <je-button>下</je-button>
        </je-button-group>
      </je-space>
    </DemoBlock>

    <DemoBlock title="点击反馈">
      <je-space align="center">
        <je-button @click="count += 1">点我 +1</je-button>
        <span class="count">当前计数：{{ count }}</span>
      </je-space>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.count {
  font-size: 14px;
  color: var(--je-text-muted);
}

/* 模拟手机宽度，用来看 block 按钮在窄容器里的效果 */
.mobile-frame {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  padding: 16px;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
}
</style>
