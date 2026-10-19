import {ref,readonly,onMounted} from 'vue';
import {savedIds,savedKey} from '../../../shared/saved-programs.mjs';
const ids=ref([]),ready=ref(false),error=ref('');
function decode(value){try{return savedIds(JSON.parse(value||'[]'));}catch{return [];}}
export function useSavedPrograms(){
  onMounted(()=>{
    if(ready.value)return;
    try{ids.value=decode(localStorage.getItem(savedKey));}
    catch{error.value='浏览器暂不能保存收藏；本页仍可使用，请导出备份。';}
    ready.value=true;
    window.addEventListener('storage',event=>{if(event.key===savedKey)ids.value=decode(event.newValue);if(event.key===null)ids.value=[];});
  });
  function save(next){
    ids.value=savedIds(next);error.value='';
    try{localStorage.setItem(savedKey,JSON.stringify(ids.value));}
    catch{error.value='浏览器暂不能保存收藏；本页仍可使用，请导出备份。';}
  }
  function toggle(id){save(ids.value.includes(id)?ids.value.filter(x=>x!==id):[...ids.value,id]);}
  function merge(next){const before=ids.value.length;save([...ids.value,...next]);return ids.value.length-before;}
  return {saved:readonly(ids),savedReady:readonly(ready),savedError:readonly(error),toggleSaved:toggle,mergeSaved:merge};
}
