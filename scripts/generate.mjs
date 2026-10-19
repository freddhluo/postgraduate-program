import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import crypto from 'node:crypto';
import {groupFields,renderFields,schoolPage,timelineText,studentText,plain,programTitle,programTags,render} from './student-content.mjs';
import {programFacts} from './program-facts.mjs';
const alumni=JSON.parse(fs.readFileSync('data/alumni.json','utf8')).cases;
const md=new MarkdownIt({html:false,linkify:true});
const regions={'china-mainland':'中国内地','hong-kong':'中国香港','singapore':'新加坡','united-states':'美国','united-kingdom':'英国','australia':'澳大利亚'};
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(path.join(d,f.name)):[path.join(d,f.name)]);
const html=render;
const section=(t,n)=>t.match(new RegExp('^## '+n+'[.、 \\t][^\\n]*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))','m'))?.[1]||'';
const schools=[],programs=[],timeline=[],issues=[];
fs.mkdirSync('docs/schools',{recursive:true}); fs.mkdirSync('docs/public/data',{recursive:true});fs.mkdirSync('docs/public/markdown',{recursive:true});
for(const file of walk('schools').filter(f=>f.endsWith('.md')).sort()){
 const raw=fs.readFileSync(file,'utf8'),{data:m,content}=matter(raw),sid=m.school_id;
 if(!sid||path.basename(file)!==sid+'.md')throw Error('学校ID或文件名不一致: '+file);
 const region=({'英国':'united-kingdom','澳大利亚':'australia'})[m.country_or_region]||m.region;
 const s={...m,id:sid,name:m.school_name_zh,region,sourceRegion:m.region,regionName:regions[region],path:`/schools/${m.region}/${sid}.html`,pdf:fs.existsSync(`docs/public/pdf/${sid}.pdf`)?`/pdf/${sid}.pdf`:null,md:`/markdown/${sid}.md`,hash:crypto.createHash('sha256').update(raw).digest('hex')};
 const rows=md.parse(section(content,2),{});const tableRows=[];
 for(let i=0;i<rows.length;i++)if(rows[i].type==='tr_open'){
  const cells=[];for(i++;i<rows.length&&rows[i].type!=='tr_close';i++)if(rows[i].type==='inline')cells.push(rows[i].content);tableRows.push(cells);
 }
 const projectSection=section(content,3); const chunks=[...projectSection.matchAll(/^### (3\.\d+)\s+([^\n]+)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)];
 if(!chunks.length)throw Error('未提取到项目: '+file);
 const schoolPrograms=[];
 for(const [whole,num,title,body] of chunks){
  const id=body.match(new RegExp(sid+'-p\\d{3}'))?.[0];if(!id)throw Error('缺少项目ID: '+file+' '+num);
  const short=id.slice(sid.length+1);
  const row=tableRows.find(c=>c[0]?.includes(id)||new RegExp('(?:^|[^a-z0-9])'+short+'(?:[^0-9]|$)').test(c[0]||''));
  if(!row)issues.push({school:sid,program:id,issue:'未匹配到概览表行，使用正文信息'});
  const fields=[...body.matchAll(/^[-*]\s+\*\*([^*\n]+)\*\*\s*[：:]?\s*([\s\S]*?)(?=^[-*]\s+\*\*|$(?![\s\S]))/gm)].map(x=>({label:x[1].replace(/[：:]$/,'').trim(),value:x[2].trim()}));
  const get=(re)=>fields.filter(f=>re.test(f.label)).map(f=>'**'+f.label+'**：'+f.value).join('\n\n');
  const basic=get(/基本情况|院系、正式|学位与|学制|城市\/校区/);
  const admission=get(/招生途径|申请.*要求|初试考试/);
  const courses=get(/课程|先修|能力准备|实践、项目/);
  const fees=get(/费用|学费|奖学金|项目级.*(就业|去向)/);
  const fit=get(/适配/); const dates=get(/关键日期|招生、竞争与关键日期/);
  const sources=[...new Set([...body.matchAll(/\]\((https?:\/\/[^\s)]+)\)/g)].map(x=>x[1]))];
  const p={id,schoolId:sid,school:s.name,region:s.region,sourceRegion:m.region,regionName:s.regionName,title:programTitle(title),department:plain(row?.[1]||'见项目正文'),degree:plain(row?.[2]||'见项目正文'),focus:plain(row?.[3]||''),admission:plain(row?.[4]||admission),overview:row?row.map(html):[],url:s.path+'#'+id,years:m.reference_intake_years,verified:m.last_verified_on,status:m.report_status,fields:{basic:html(basic||row?.[2]||'见项目正文'),admission:html(admission||row?.[4]||'见项目正文'),courses:html(courses||'见项目正文'),fees:html(fees||row?.[5]||'见项目正文'),fit:html(fit||'见项目正文'),dates:html(dates||'详见单校申请时间线，未单列项目日期')},sources,search:plain(title+' '+body)};
  p.tags=programTags(p.title,p.focus);
  const groups=groupFields(fields,id);
  if(!groups.basic.length && row) groups.basic.push({label:'院系与学制',value:row[1]+'；'+row[2]});
  for(const key of ['basic','admission','courses','fees','fit','dates']) {
   const output=renderFields(groups[key]);
   if(output) p.fields[key]=output;
   else p.fields[key]='<p>—</p>';
  }
  p.degree=plain(studentText(row?.[2]||p.degree));
  p.focus=plain(studentText(row?.[3]||p.focus));
  p.facts=programFacts(p,groups,row,fields);
  programs.push(p);schoolPrograms.push({...p,row,groups});
 }
 s.count=chunks.length;s.sources=[...new Set([...section(content,7).matchAll(/https?:\/\/[^\s)<>|]+/g)].map(x=>x[0]))].length;
 const t=section(content,4);timeline.push({schoolId:sid,school:s.name,region:s.region,path:s.path+'#application-timeline',html:html(timelineText(t))});
 const generated=schoolPage(s,schoolPrograms,content,section,alumni);
 const dest='docs'+s.path.replace(/\.html$/,'.md');fs.mkdirSync(path.dirname(dest),{recursive:true});
 const fm={...m,title:s.name+' · 硕士项目与申请',description:s.name+'的项目方向、课程、申请要求、费用和时间线',pageClass:'student-school',outline:2,pdf:s.pdf,sourceMd:s.md,program_count:s.count};
 fs.writeFileSync(dest,matter.stringify(generated,fm));fs.writeFileSync('docs/public/markdown/'+sid+'.md',raw);schools.push(s);
}
if(new Set(programs.map(p=>p.id)).size!==programs.length)throw Error('重复项目ID');
const data={schools,regions,programCount:programs.length,sourceCount:schools.reduce((n,s)=>n+s.sources,0),assembledOn:'2026-10-19',issues};
fs.writeFileSync('data/catalog.json',JSON.stringify(data,null,2));fs.writeFileSync('docs/public/data/programs.json',JSON.stringify(programs));fs.writeFileSync('docs/public/data/timelines.json',JSON.stringify(timeline));
// The explorer loads searchable summaries first; full, linked text is fetched
// only for the schools included in a comparison.
fs.writeFileSync('docs/public/data/program-index.json',JSON.stringify(programs.map(({fields,overview,sources,...p})=>p)));
fs.mkdirSync('docs/public/data/program-details',{recursive:true});
for(const s of schools)fs.writeFileSync(`docs/public/data/program-details/${s.id}.json`,JSON.stringify(Object.fromEntries(programs.filter(p=>p.schoolId===s.id).map(p=>[p.id,{fields:p.fields,sources:p.sources}]))));
const columns=['school_id','program_id','school_name','region','program_name','department','degree_duration','focus','admissions','reference_intake_years','last_verified_on','report_status','source_urls','markdown_path','duration_category','admission_routes','routes_need_review'];
const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
const csv=[columns,...programs.map(p=>[p.schoolId,p.id,p.school,p.region,p.title,p.department,p.degree,p.focus,p.admission,(p.years||[]).join(';'),p.verified,p.status,p.sources.join(' '),`schools/${p.sourceRegion}/${p.schoolId}.md`,p.facts.duration.category,p.facts.routes.values.join(';'),p.facts.routes.uncertain])].map(r=>r.map(quote).join(',')).join('\n');
fs.writeFileSync('data/programs.csv','\ufeff'+csv);fs.writeFileSync('docs/public/data/programs.csv','\ufeff'+csv);
console.log(JSON.stringify({schools:schools.length,programs:programs.length,issues},null,2));
