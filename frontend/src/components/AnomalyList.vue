<template>
  <div class="panel">
    <h4>
      ⚠️ 近期告警
      <span v-if="selected" class="sel-badge" :style="{color: selColor, borderColor: selColor}">
        {{ groupLabel }}：{{ selected }}
        <button class="clear-btn" @click="clearSel">✕</button>
      </span>
    </h4>

    <!-- 选中组：逐条列出触发规则及最近一次发生时间 -->
    <div v-if="selected" class="rules-box">
      <div v-if="!ruleRows.length" class="empty">
        「{{ selected }}」暂无告警触发规则（该分组无数据）
      </div>
      <div v-for="r in ruleRows" :key="r.rule" class="rule-row"
           :style="{borderLeftColor: selColor}">
        <span class="rule-name">{{ r.rule }}</span>
        <span class="rule-meta">触发 {{ r.count }} 次</span>
        <span class="rule-time">最近: {{ ts(r.lastTime) }}</span>
      </div>
    </div>

    <!-- 清单：选中组高亮、其余组淡化 -->
    <div v-if="!anomalies.length" class="empty">暂无告警</div>
    <div v-for="(a,i) in anomalies" :key="i"
         class="anomaly-row" :class="rowClass(a)" :style="{'--c': rowColor(a)}">
      <i class="a-dot"></i>
      <span class="a-time">{{ ts(a.timestamp) }}</span>
      <span class="a-group">{{ groupName(a) }}</span>
      <span v-for="t in a.triggers" :key="t.rule" class="a-tag">{{ t.rule }}: {{ t.value.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFactoryStore } from '../store/factory'
import { groupColor, shiftOf, GROUP_LABEL, type Anomaly } from '../types'

const store = useFactoryStore()
const anomalies = computed<Anomaly[]>(() => store.data?.anomalies || [])
const selected = computed(() => store.selectedFaultGroup)
const groupBy = computed(() => store.faultGroupBy)
const groupLabel = computed(() => GROUP_LABEL[groupBy.value])
const selColor = computed(() =>
  selected.value ? groupColor(groupBy.value, selected.value) : '#94a3b8')

function groupName(a: Anomaly): string {
  if (groupBy.value === 'type') return a.device_type
  if (groupBy.value === 'area') return a.area || ''
  return a.shift || shiftOf(a.timestamp)
}

function rowColor(a: Anomaly): string {
  return groupColor(groupBy.value, groupName(a))
}

function rowClass(a: Anomaly) {
  if (!selected.value) return {}
  return { on: groupName(a) === selected.value, off: groupName(a) !== selected.value }
}

// 选中组内每条触发规则的累计次数与最近一次发生时间
const ruleRows = computed(() => {
  const map = new Map<string, { rule: string; count: number; lastTime: number }>()
  for (const a of anomalies.value) {
    if (groupName(a) !== selected.value) continue
    for (const t of a.triggers) {
      const cur = map.get(t.rule)
      if (cur) {
        cur.count += 1
        cur.lastTime = Math.max(cur.lastTime, a.timestamp)
      } else {
        map.set(t.rule, { rule: t.rule, count: 1, lastTime: a.timestamp })
      }
    }
  }
  return [...map.values()].sort((x, y) => y.lastTime - x.lastTime)
})

function clearSel() { store.selectedFaultGroup = null }
function ts(t: number) { return new Date(t * 1000).toLocaleTimeString() }
</script>

<style scoped>
.panel{background:#0d1b2a;border-radius:8px;padding:12px;border:1px solid #1e3a5f;flex:1}
.panel h4{color:#f87171;margin-bottom:8px;font-size:13px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sel-badge{font-size:10px;font-weight:400;border:1px solid;border-radius:4px;padding:1px 6px;display:inline-flex;align-items:center;gap:4px}
.clear-btn{background:none;border:none;color:inherit;cursor:pointer;font-size:10px;line-height:1;padding:0}
.rules-box{margin-bottom:8px;border-top:1px dashed #1e3a5f;padding-top:6px;display:flex;flex-direction:column;gap:3px}
.rule-row{display:flex;align-items:center;gap:8px;background:#112233;border-left:3px solid #666;
  border-radius:3px;padding:4px 8px;font-size:11px}
.rule-name{color:#e0e6ed;font-weight:600}
.rule-meta{color:#94a3b8;font-size:10px;margin-left:auto}
.rule-time{color:#fbbf24;font-size:10px;min-width:78px;text-align:right}
.empty{color:#64748b;font-size:12px}
.anomaly-row{display:flex;gap:8px;padding:4px 4px;font-size:11px;color:#fca5a5;flex-wrap:wrap;
  align-items:center;border-radius:3px;border-left:2px solid transparent;transition:opacity .15s}
.a-dot{width:7px;height:7px;border-radius:50%;flex:none;background:var(--c)}
.anomaly-row.on{background:#16263c;border-left-color:var(--c,#64b5f6)}
.anomaly-row.off{opacity:.3}
.a-time{color:#64748b;min-width:70px}
.a-group{color:#cbd5e1;background:#1e3a5f55;border-radius:3px;padding:0 5px;font-size:10px}
.a-tag{background:#7f1d1d33;padding:1px 6px;border-radius:3px;border:1px solid #7f1d1d55}
</style>
