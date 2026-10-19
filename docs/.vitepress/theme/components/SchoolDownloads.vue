<script setup>
import {useData,withBase} from 'vitepress';
const {frontmatter}=useData();
</script>
<template><div class="reading-downloads"><a v-if="frontmatter.pdf" :href="withBase(frontmatter.pdf)" target="_blank" rel="noopener">完整资料 PDF ↗</a><a v-if="frontmatter.sourceMd" :href="withBase(frontmatter.sourceMd)" download>下载详细资料 ↓</a></div></template>
