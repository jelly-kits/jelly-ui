<script setup lang="ts">
import { ref } from 'vue'
import { JeScrollbar, JeTab, JeTabItem } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const basic = ref<string | number>('all')
const swipe = ref<string | number>('a')
const notice = ref<string | number>('msg')
const custom = ref<string | number>('hot')
</script>

<template>
  <DemoPage
    title="Tab 标签页"
    description="移动端标签页：下划线跟随激活项滑动，标签条超出时可横向滚动，内容区可左右滑动切页。"
  >
    <DemoBlock
      title="基础用法"
      description="Tab 包裹若干 TabItem，用 v-model 绑定激活项的 name，每个子项的默认插槽就是这一页的内容。"
    >
      <je-tab v-model="basic">
        <je-tab-item name="all" title="全部">
          <p class="pane">全部订单内容</p>
        </je-tab-item>
        <je-tab-item name="pending" title="待付款">
          <p class="pane">待付款订单内容</p>
        </je-tab-item>
        <je-tab-item name="shipped" title="待发货">
          <p class="pane">待发货订单内容</p>
        </je-tab-item>
        <je-tab-item name="done" title="已完成">
          <p class="pane">已完成订单内容</p>
        </je-tab-item>
      </je-tab>
      <p class="state">当前标签：{{ basic }}</p>
    </DemoBlock>

    <DemoBlock
      title="可滑动切页与角标"
      description="swipeable 打开后内容区可左右滑动，横向位移超过 swipeThreshold 才切页；badge 显示角标，disabled 的标签不可点也无法滑入。"
    >
      <je-tab v-model="swipe" :swipe-threshold="60">
        <je-tab-item name="a" title="推荐">
          <p class="pane">向左滑动查看下一屏</p>
        </je-tab-item>
        <je-tab-item name="b" title="关注" badge="8">
          <p class="pane">可以继续左右滑动</p>
        </je-tab-item>
        <je-tab-item name="c" title="无权限" disabled>
          <p class="pane">该标签已禁用，滑动与点击都会被跳过</p>
        </je-tab-item>
        <je-tab-item name="d" title="最新" dot>
          <p class="pane">已经到最后一屏</p>
        </je-tab-item>
      </je-tab>
      <p class="state">当前标签：{{ swipe }}</p>
    </DemoBlock>

    <DemoBlock
      title="吸顶"
      description="sticky 让标签条在滚动容器内吸顶，offsetTop 控制距容器顶部的距离。"
    >
      <je-scrollbar height="220px" class="scroller">
        <je-tab v-model="notice" sticky :offset-top="0">
          <je-tab-item name="msg" title="消息" badge="5">
            <p class="pane">消息列表</p>
          </je-tab-item>
          <je-tab-item name="todo" title="待办">
            <p class="pane">待办列表</p>
          </je-tab-item>
          <je-tab-item name="system" title="系统通知">
            <p class="pane">系统通知</p>
          </je-tab-item>
        </je-tab>
        <p v-for="n in 12" :key="n" class="line">滚动内容第 {{ n }} 行</p>
      </je-scrollbar>
      <p class="state">当前标签：{{ notice }}</p>
    </DemoBlock>

    <DemoBlock
      title="自定义配色与下划线"
      description="activeColor / inactiveColor 换个配色，lineWidth 与 lineHeight 控制下划线的宽高（数字按 px，字符串支持百分比）。"
    >
      <je-tab
        v-model="custom"
        active-color="#f59e0b"
        inactive-color="var(--je-text-faint)"
        background="var(--je-surface)"
        :line-width="24"
        :line-height="4"
      >
        <je-tab-item name="hot" title="热销">
          <p class="pane">热销榜单</p>
        </je-tab-item>
        <je-tab-item name="new" title="新品">
          <p class="pane">新品上架</p>
        </je-tab-item>
        <je-tab-item name="cheap" title="特价">
          <p class="pane">特价专区</p>
        </je-tab-item>
      </je-tab>
      <p class="state">当前标签：{{ custom }}</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.pane {
  margin: 0;
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--je-text-muted);
  background: var(--je-surface-hover);
  border-radius: var(--je-radius);
}

.state {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}

.line {
  margin: 0;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--je-text-muted);
  border-bottom: var(--je-border);
}

.scroller {
  border: var(--je-border);
  border-radius: var(--je-radius);
}
</style>