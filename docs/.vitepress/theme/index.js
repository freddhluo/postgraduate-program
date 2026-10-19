import DefaultTheme from 'vitepress/theme';
import {h} from 'vue';
import Home from './components/Home.vue';
import SchoolGrid from './components/SchoolGrid.vue';
import Explorer from './components/Explorer.vue';
import Timelines from './components/Timelines.vue';
import ReportMeta from './components/ReportMeta.vue';
import './style.css';
export default {...DefaultTheme,Layout:()=>h(DefaultTheme.Layout,null,{'doc-before':()=>h(ReportMeta)}),enhanceApp({app}){app.component('Home',Home);app.component('SchoolGrid',SchoolGrid);app.component('Explorer',Explorer);app.component('Timelines',Timelines)}};
