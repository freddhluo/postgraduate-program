import DefaultTheme from 'vitepress/theme';
import Home from './components/Home.vue';
import SchoolGrid from './components/SchoolGrid.vue';
import Explorer from './components/Explorer.vue';
import Timelines from './components/Timelines.vue';
import Alumni from './components/Alumni.vue';
import SchoolDownloads from './components/SchoolDownloads.vue';
import './style.css';
export default {...DefaultTheme,enhanceApp({app}){app.component('Home',Home);app.component('Alumni',Alumni);app.component('SchoolDownloads',SchoolDownloads);app.component('SchoolGrid',SchoolGrid);app.component('Explorer',Explorer);app.component('Timelines',Timelines)}};
