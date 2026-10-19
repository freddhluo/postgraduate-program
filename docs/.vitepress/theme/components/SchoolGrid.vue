<script setup>
import {ref,computed,onMounted,onUnmounted,watch,nextTick} from 'vue';import {withBase} from 'vitepress';import catalog from '../../../../data/catalog.json';
const region=ref(''),query=ref('');
let restoring=true;
async function restore(){
 restoring=true;const params=new URLSearchParams(location.search),r=params.get('region');
 region.value=Object.hasOwn(catalog.regions,r)?r:'';query.value=params.get('q')||'';
 await nextTick();restoring=false;
}
onMounted(()=>{restore();window.addEventListener('popstate',restore);});
onUnmounted(()=>window.removeEventListener('popstate',restore));
watch([region,query],()=>{
 if(restoring)return;const u=new URL(location.href);u.search='';
 if(region.value)u.searchParams.set('region',region.value);if(query.value)u.searchParams.set('q',query.value);
 history.replaceState(null,'',u.toString());
});
const filtered=computed(()=>catalog.schools.filter(s=>(!region.value||s.region===region.value)&&(!query.value||`${s.name} ${s.school_name_en} ${s.id}`.toLowerCase().includes(query.value.trim().toLowerCase()))));
</script>
<template><div class="app-page"><header class="page-intro"><div class="eyebrow">SCHOOL DIRECTORY</div><h1>院校导航<span class="count-badge">{{catalog.schools.length}}</span></h1><p>从你感兴趣的大学开始，了解项目之间的差异。</p></header><div class="filter-bar"><label class="search-field"><span aria-hidden="true">⌕</span><input v-model="query" aria-label="搜索大学" placeholder="搜索大学中文名、英文名…"></label><label class="select-field"><span>地区</span><select v-model="region" aria-label="院校地区"><option value="">全部地区</option><option v-for="(n,id) in catalog.regions" :key="id" :value="id">{{n}}</option></select></label></div><div class="result-summary"><span role="status">找到 {{filtered.length}} 所大学</span> <button v-if="query||region" @click="query='';region=''" class="text-button">重置筛选</button><span>按资料索引排列，无院校排名</span></div><div class="school-grid"><article class="school-card" v-for="s in filtered" :key="s.id"><div class="school-card-top"><span>{{s.regionName}}</span><span class="badge">{{s.country_or_region}}</span></div><a :href="withBase(s.path)"><h2>{{s.name}}</h2><p class="english-name">{{s.school_name_en}}</p></a><div class="school-count"><strong>{{s.count}}</strong> 项目 / 培养方向条目</div><div class="school-meta">参考入学年 {{s.reference_intake_years.join(' / ')}}<br>资料日期 {{s.last_verified_on}}</div><div class="school-links directory-links"><a :href="withBase(s.path)">查看项目 ↗</a><a :href="withBase(`/programs.html?school=${s.id}`)">筛选与对比</a><a :href="withBase(`/timeline.html?school=${s.id}#school-dates`)">时间线</a><a v-if="s.pdf" :href="withBase(s.pdf)" target="_blank" rel="noopener">PDF ↗</a><a :href="withBase(s.md)" download>MD ↓</a></div></article></div><div v-if="!filtered.length" class="empty-state"><h2>没有找到匹配大学</h2><p>试试缩短关键词，或选择全部地区。</p></div></div></template>
