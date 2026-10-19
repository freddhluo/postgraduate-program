<script setup>
import {ref,computed,watch} from 'vue';
import {useData,withBase} from 'vitepress';
const {frontmatter}=useData();
const query=ref(''),selected=ref('');
const programs=computed(()=>frontmatter.value.program_navigation||[]);
const filtered=computed(()=>programs.value.filter(p=>`${p.title} ${p.department} ${p.focus}`.toLowerCase().includes(query.value.trim().toLowerCase())));
watch(filtered,list=>{if(!list.some(p=>p.id===selected.value))selected.value=list[0]?.id||'';},{immediate:true});
watch(()=>frontmatter.value.school_id,()=>{query.value='';});
</script>

<template>
<nav id="school-program-navigation" class="school-program-nav" aria-label="本校项目导航">
 <div class="school-nav-heading"><strong>快速找到本校项目</strong><a :href="withBase(`/programs.html?school=${frontmatter.school_id}`)">检索与对比本校项目 →</a></div>
 <label class="school-nav-search"><span>按项目名称、院系或培养重点查找</span><input v-model="query" type="search" aria-label="查找本校项目" placeholder="输入方向或学院关键词"></label>
 <div class="school-nav-select"><label><span class="sr-only">选择本校项目</span><select v-model="selected" :disabled="!filtered.length"><option v-if="!filtered.length" value="">没有匹配的项目</option><option v-for="p in filtered" :key="p.id" :value="p.id">{{p.title}}</option></select></label><a v-if="selected" class="button primary" :href="`#${selected}`">查看项目 ↓</a></div>
 <div class="school-nav-footer"><span role="status">{{filtered.length}} / {{programs.length}} 个项目</span><button v-if="query" class="text-button" @click="query=''">清除关键词</button><a href="#program-overview">项目速览</a><a href="#application-timeline">申请时间线</a><a href="#official-sources">官方资料</a></div>
</nav>
</template>
