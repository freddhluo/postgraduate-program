<script setup>
import {ref,reactive,computed,onMounted,onUnmounted,watch,nextTick} from 'vue';
import {withBase} from 'vitepress';
import catalog from '../../../../data/catalog.json';
import {useSavedPrograms} from '../useSavedPrograms.mjs';
import {timelinePaths,timelineSchools,readTimelineFilters} from '../../../../shared/timeline-filters.mjs';
const {saved}=useSavedPrograms();
const filters=reactive({region:'',path:'',savedOnly:false,school:'cn-uibe'}),data=ref([]),error=ref(''),note=ref(''),schoolSection=ref(null);
let restoring=true;
const schools=computed(()=>timelineSchools(catalog,filters,saved.value));
const selected=computed(()=>data.value.find(s=>s.schoolId===filters.school));
const metadata=computed(()=>catalog.schools.find(s=>s.id===filters.school));
const stages=[['2026 秋','大三上','了解本校推免条件、目标项目与科研准备','比较考试科目与跨专业要求','核对先修课、语言及 GRE / GMAT 要求'],['2027 春夏','大三下 / 暑期','准备夏令营、提前选拔及面试材料','按统考与专业课系统复习','准备考试、推荐信、文书与实践经历'],['2027 秋','大四上','关注预推免、正式推免与录取确认','核对招生目录、网报及网上确认','按各项目轮次递交；留意更早批次'],['2027 冬 — 2028 春','申请与考核','关注录取后的材料及资格要求','初试、成绩、复试与调剂','后续轮次、面试及录取结果比较'],['2028 春夏','毕业与入学','完成毕业和入学手续','确认录取与毕业手续','确认入学、签证、住宿及必要费用']];
const paths=computed(()=>timelinePaths.map(([id,label],index)=>({id,label,index:index+2})).filter(p=>!filters.path||p.id===filters.path));
function urlFor(share=false){
 const u=new URL(location.href);u.search='';
 for(const key of ['path','region','school'])if(filters[key])u.searchParams.set(key,filters[key]);
 if(filters.savedOnly&&!share)u.searchParams.set('saved','1');
 return u;
}
async function restore(){restoring=true;Object.assign(filters,readTimelineFilters(new URLSearchParams(location.search),catalog,saved.value));await nextTick();restoring=false;}
async function load(){error.value='';try{const r=await fetch(withBase('/data/timelines.json'));if(!r.ok)throw Error();data.value=await r.json();}catch{error.value='时间线加载失败，请重试。';}}
onMounted(async()=>{await restore();await load();if(location.hash==='#school-dates'){await nextTick();schoolSection.value?.scrollIntoView();}window.addEventListener('popstate',restore);});
onUnmounted(()=>window.removeEventListener('popstate',restore));
watch(schools,()=>{if(!schools.value.some(s=>s.id===filters.school))filters.school=schools.value[0]?.id||'';});
watch(filters,()=>{note.value='';if(!restoring)history.replaceState(null,'',urlFor().toString());});
async function share(){const u=urlFor(true);u.hash='school-dates';try{await navigator.clipboard.writeText(u.toString());note.value='已复制该校时间线链接。';}catch{history.replaceState(null,'',u.toString());note.value='请复制地址栏中的该校时间线链接。';}}
</script>
<template>
<div class="app-page timeline-page">
 <header class="page-intro"><div class="eyebrow">APPLICATION ROADMAP</div><h1>把准备放在截止日期之前。</h1><p>先看升学准备节奏，再看学校实际发布的日程。按目标入学年份制定自己的计划。</p><a class="text-link" href="#school-dates">直接查看逐校日程 ↓</a></header>
 <section id="preparation">
  <div class="section-heading"><h2>2028 入学 · 三条路径准备节奏</h2><span class="badge">规划示意 · 非官方截止日</span></div>
  <div class="chips timeline-paths" aria-label="准备路径"><button :class="{active:!filters.path}" :aria-pressed="!filters.path" @click="filters.path=''">全部路径</button><button v-for="[id,label] in timelinePaths" :key="id" :class="{active:filters.path===id}" :aria-pressed="filters.path===id" @click="filters.path=id">{{label}}</button></div>
  <div class="stage-list"><article v-for="(stage,index) in stages" :key="stage[0]" class="stage-card"><header><span class="stage-number">{{String(index+1).padStart(2,'0')}}</span><h3>{{stage[0]}}<small>{{stage[1]}}</small></h3></header><div class="stage-tasks" :class="{'single-path':paths.length===1}"><div v-for="p in paths" :key="p.id"><h4>{{p.label}}</h4><p>{{stage[p.index]}}</p></div></div></article></div>
 </section>
 <section id="school-dates" ref="schoolSection" class="school-timeline">
  <div class="section-heading"><div><div class="eyebrow">DATES FROM THE REPORTS</div><h2>逐校申请与考试节点</h2></div><a :href="withBase('/programs.html?saved=1')">管理项目收藏 →</a></div>
  <div class="timeline-filters"><label class="select-field"><span>地区</span><select v-model="filters.region" aria-label="时间线地区"><option value="">全部地区</option><option v-for="(name,id) in catalog.regions" :key="id" :value="id">{{name}}</option></select></label><label class="select-field"><span>选择大学</span><select v-model="filters.school" :disabled="!schools.length" aria-label="时间线大学"><option v-if="!schools.length" value="">没有匹配学校</option><option v-for="s in schools" :key="s.id" :value="s.id">{{s.name}}</option></select></label><label class="saved-school-toggle"><input v-model="filters.savedOnly" type="checkbox">只看收藏项目所在学校</label></div>
  <div class="notice"><span>注意届别</span><p>下方保留该校原始日程与适用年份。上方路径按钮只切换准备建议；参考往届节点安排准备，正式递交以目标届别通知为准。</p></div>
  <p v-if="note" role="status" class="explorer-feedback">{{note}}</p>
  <div v-if="!schools.length" class="empty-state"><h3>没有匹配的学校</h3><p>试试其他地区，或先收藏感兴趣的项目。收藏只保存在当前浏览器和站点。</p><button class="button secondary" @click="filters.region='';filters.savedOnly=false">查看全部学校</button></div>
  <div v-else-if="error" role="alert">{{error}} <button class="button secondary" @click="load">重试</button></div>
  <div v-else-if="!selected" role="status">正在读取时间线…</div>
  <template v-else><div class="timeline-school-title"><div><h3>{{selected.school}}</h3><p>参考入学 {{metadata?.reference_intake_years?.join(' / ')}} · 核验 {{metadata?.last_verified_on}}</p></div><div class="timeline-school-actions"><button class="text-button" @click="share">复制该校时间线链接</button><a :href="withBase(selected.path)">查看学校项目 ↗</a></div></div><div class="vp-doc timeline-content" v-html="selected.html"></div></template>
 </section>
</div>
</template>
