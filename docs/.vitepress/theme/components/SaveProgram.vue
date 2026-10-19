<script setup>
import {ref,computed} from 'vue';
import {useSavedPrograms} from '../useSavedPrograms.mjs';
const props=defineProps({id:{type:String,required:true},title:{type:String,default:'此项目'}});
const {saved,savedReady,savedError,toggleSaved}=useSavedPrograms();
const active=computed(()=>saved.value.includes(props.id)),attempted=ref(false);
function toggle(){attempted.value=true;toggleSaved(props.id);}
</script>
<template><span class="save-program"><button class="save-button" :class="{active}" :disabled="!savedReady" :aria-pressed="active" :aria-label="`${active?'取消收藏':'收藏项目'}：${title}`" @click="toggle">{{active?'★ 已收藏':'☆ 收藏'}}</button><small v-if="attempted&&savedError" role="status">{{savedError}}</small></span></template>
