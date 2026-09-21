/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from 'vue';
import { useFactoryStore } from '../store/factory';
import { groupColor, shiftOf, GROUP_LABEL } from '../types';
const store = useFactoryStore();
const anomalies = computed(() => store.data?.anomalies || []);
const selected = computed(() => store.selectedFaultGroup);
const groupBy = computed(() => store.faultGroupBy);
const groupLabel = computed(() => GROUP_LABEL[groupBy.value]);
const selColor = computed(() => selected.value ? groupColor(groupBy.value, selected.value) : '#94a3b8');
function groupName(a) {
    if (groupBy.value === 'type')
        return a.device_type;
    if (groupBy.value === 'area')
        return a.area || '';
    return a.shift || shiftOf(a.timestamp);
}
function rowColor(a) {
    return groupColor(groupBy.value, groupName(a));
}
function rowClass(a) {
    if (!selected.value)
        return {};
    return { on: groupName(a) === selected.value, off: groupName(a) !== selected.value };
}
// 选中组内每条触发规则的累计次数与最近一次发生时间
const ruleRows = computed(() => {
    const map = new Map();
    for (const a of anomalies.value) {
        if (groupName(a) !== selected.value)
            continue;
        for (const t of a.triggers) {
            const cur = map.get(t.rule);
            if (cur) {
                cur.count += 1;
                cur.lastTime = Math.max(cur.lastTime, a.timestamp);
            }
            else {
                map.set(t.rule, { rule: t.rule, count: 1, lastTime: a.timestamp });
            }
        }
    }
    return [...map.values()].sort((x, y) => y.lastTime - x.lastTime);
});
function clearSel() { store.selectedFaultGroup = null; }
function ts(t) { return new Date(t * 1000).toLocaleTimeString(); }
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['anomaly-row']} */ ;
/** @type {__VLS_StyleScopedClasses['anomaly-row']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
if (__VLS_ctx.selected) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "sel-badge" },
        ...{ style: ({ color: __VLS_ctx.selColor, borderColor: __VLS_ctx.selColor }) },
    });
    (__VLS_ctx.groupLabel);
    (__VLS_ctx.selected);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.clearSel) },
        ...{ class: "clear-btn" },
    });
}
if (__VLS_ctx.selected) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rules-box" },
    });
    if (!__VLS_ctx.ruleRows.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
        (__VLS_ctx.selected);
    }
    for (const [r] of __VLS_getVForSourceType((__VLS_ctx.ruleRows))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (r.rule),
            ...{ class: "rule-row" },
            ...{ style: ({ borderLeftColor: __VLS_ctx.selColor }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "rule-name" },
        });
        (r.rule);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "rule-meta" },
        });
        (r.count);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "rule-time" },
        });
        (__VLS_ctx.ts(r.lastTime));
    }
}
if (!__VLS_ctx.anomalies.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty" },
    });
}
for (const [a, i] of __VLS_getVForSourceType((__VLS_ctx.anomalies))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (i),
        ...{ class: "anomaly-row" },
        ...{ class: (__VLS_ctx.rowClass(a)) },
        ...{ style: ({ '--c': __VLS_ctx.rowColor(a) }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "a-dot" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "a-time" },
    });
    (__VLS_ctx.ts(a.timestamp));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "a-group" },
    });
    (__VLS_ctx.groupName(a));
    for (const [t] of __VLS_getVForSourceType((a.triggers))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            key: (t.rule),
            ...{ class: "a-tag" },
        });
        (t.rule);
        (t.value.toFixed(1));
    }
}
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['sel-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['rules-box']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-row']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-name']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['rule-time']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['anomaly-row']} */ ;
/** @type {__VLS_StyleScopedClasses['a-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['a-time']} */ ;
/** @type {__VLS_StyleScopedClasses['a-group']} */ ;
/** @type {__VLS_StyleScopedClasses['a-tag']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            anomalies: anomalies,
            selected: selected,
            groupLabel: groupLabel,
            selColor: selColor,
            groupName: groupName,
            rowColor: rowColor,
            rowClass: rowClass,
            ruleRows: ruleRows,
            clearSel: clearSel,
            ts: ts,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
