// 拖拽排序组件的独立入口（`@jelly-kits/jelly-ui/sortable`）。
//
// 刻意不从 src/index.ts 导出：它依赖 sortablejs，而那个包记为「可选 peer」——
// 一旦进了主入口，没用到拖拽排序的用户也会被要求安装它。
// 独立成入口后，只有真的 import 了本模块的人才需要装（见 vite.config.ts 的 external）。
export { JeDragSort } from './components/JeDragSort'
export type { JeDragSortEvent, JeDragSortItem, JeDragSortTarget } from './components/JeDragSort'
