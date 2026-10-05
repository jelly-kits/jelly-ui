<script setup lang="ts">
import { ref } from 'vue'
import { JeIndexAnchor, JeIndexBar, JeScrollbar } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const indexList = ['A', 'B', 'C', 'D', 'E']

const groups = [
  { index: 'A', items: ['阿轲', '安琪拉', '艾琳'] },
  { index: 'B', items: ['白起', '百里守约', '扁鹊', '不知火舞'] },
  { index: 'C', items: ['曹操', '蔡文姬', '程咬金'] },
  { index: 'D', items: ['妲己', '狄仁杰', '典韦'] },
  { index: 'E', items: ['er 二狗', '鄂尔多斯'] },
]

const current = ref('A')

const onSelect = (index: string | number) => {
  current.value = String(index)
}

const customList = ['一', '二', '三', '四']

const customGroups = [
  { index: '一', items: ['第一章', '第一节'] },
  { index: '二', items: ['第二章', '第二节', '第三节'] },
  { index: '三', items: ['第三章'] },
  { index: '四', items: ['第四章', '第五节'] },
]
</script>

<template>
  <DemoPage
    title="IndexBar 索引栏"
    description="通讯录式的右侧索引导航，点击或滑动索引条即可跳转到对应分组，当前分组头部自动吸顶。"
  >
    <DemoBlock title="基础用法" description="外层需有一个可滚动容器，索引条会向上查找最近的可滚动祖先。">
      <je-scrollbar class="scroll-box" :height="320">
        <je-index-bar :index-list="indexList" @change="current = String($event)" @select="onSelect">
          <je-index-anchor v-for="group in groups" :key="group.index" :index="group.index">
            <div v-for="name in group.items" :key="name" class="row">{{ name }}</div>
          </je-index-anchor>
        </je-index-bar>
      </je-scrollbar>
      <p class="hint">当前分组：{{ current }}</p>
    </DemoBlock>

    <DemoBlock title="自定义索引与吸顶偏移" description="indexList 可传任意字符串数组，stickyOffsetTop 用于避开顶部的固定栏。">
      <je-scrollbar class="scroll-box" :height="320">
        <je-index-bar :index-list="customList" :sticky-offset-top="0">
          <je-index-anchor v-for="group in customGroups" :key="group.index" :index="group.index">
            <div v-for="name in group.items" :key="name" class="row row--tall">{{ name }}</div>
          </je-index-anchor>
        </je-index-bar>
      </je-scrollbar>
    </DemoBlock>

    <DemoBlock title="自定义高亮色">
      <je-scrollbar class="scroll-box" :height="320">
        <je-index-bar :index-list="indexList" highlight-color="var(--je-danger)">
          <je-index-anchor v-for="group in groups" :key="group.index" :index="group.index">
            <div v-for="name in group.items" :key="name" class="row">{{ name }}</div>
          </je-index-anchor>
        </je-index-bar>
      </je-scrollbar>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.scroll-box {
  border: 1px solid var(--je-border-color);
  border-radius: var(--je-radius);
  background: var(--je-surface);
}

.scroll-box + .scroll-box {
  margin-top: 16px;
}

.row {
  padding: 12px 15px;
  border-bottom: 1px solid var(--je-border-color);
  font-size: 14px;
  color: var(--je-text);
}

.row--tall {
  padding: 22px 15px;
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}
</style>
