import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {studentText,timelineText,render,programTitle} from './student-content.mjs';
const catalog=JSON.parse(fs.readFileSync('data/catalog.json'));
const programs=JSON.parse(fs.readFileSync('docs/public/data/programs.json'));
const timelines=JSON.parse(fs.readFileSync('docs/public/data/timelines.json'));
const dist='docs/.vitepress/dist',base=process.env.SITE_BASE||'/';
const alumni=JSON.parse(fs.readFileSync('data/alumni.json'));
assert.equal(studentText('项目级就业率官网未公开。'),'');
assert.ok(studentText('2027年学费12.8万元；2028年费用待核验。').includes('12.8万元'));
assert.ok(studentText('开学前至少2年毕业后全职工作经验，本科实习不算。').includes('本科实习不算'));
assert.equal(programTitle('应用统计硕士 / 英文正式项目名官网未公开（数学科学学院）'),'应用统计硕士（数学科学学院）');
const dateTable=render(timelineText('| 项目 | 事项 | 日期 | 未公开事项 |\n|---|---|---|---|\n| A | 报名 | 2027-01-01 | 面试待核验 |\n| B | 申请 | 官网未公开 | 待核验 |'));
assert.ok(dateTable.includes('<thead>') && dateTable.includes('<table>'));
assert.ok(dateTable.includes('2027-01-01') && !dateTable.includes('<td>B</td>'));
assert.equal(catalog.schools.filter(s=>s.region==='united-kingdom').length,4);
assert.equal(catalog.schools.filter(s=>s.region==='australia').length,3);
assert.ok(!catalog.schools.some(s=>s.region==='other'));
for(const [id,tag] of [['cn-nankai-p007','统计与应用数学'],['us-nyu-p009','统计与应用数学'],['au-unimelb-p004','精算与风险管理'],['other-oxford-p006','数据与商业分析']])assert.ok(programs.find(p=>p.id===id)?.tags.includes(tag),id+' category missing');
assert.ok(!programs.find(p=>p.id==='cn-pku-p004').tags.includes('管理与运筹'));
for(const p of programs) {
 assert.ok(!/官网未公开|待官网确认|英文称谓待核/.test(p.title),p.id+' title has editorial notes');
 assert.ok(p.tags.length>0,p.id+' has no category');
 for(const key of ['title','department','degree','focus'])assert.ok(!/(?<!\w)S\d+[：:]|(?<!\w)S\d+(?!\w)/.test(p[key]),p.id+' citation code leaked into '+key);
}
const alumniPage=fs.readFileSync(dist+'/alumni.html','utf8');
const people=[...alumni.cases,...alumni.employment];
assert.equal(new Set(people.map(a=>a.id)).size,people.length);
for(const a of people){
 assert.ok(alumniPage.includes(`id="${a.id}"`),a.id+' missing alumni anchor');
 assert.match(a.source,/^https:\/\/(tongji|news)\.uibe\.edu\.cn\//);
 for(const id of a.schoolIds||[])assert.ok(catalog.schools.some(s=>s.id===id),'unknown alumni school '+id);
}
assert.equal(programs.length,catalog.programCount);assert.equal(new Set(programs.map(p=>p.id)).size,programs.length);
for(const s of catalog.schools){
 const src=fs.readFileSync(`schools/${s.sourceRegion}/${s.id}.md`);
 assert.equal(crypto.createHash('sha256').update(src).digest('hex'),s.hash);
 assert.deepEqual(src,fs.readFileSync('docs/public'+s.md));
 assert.equal(programs.filter(p=>p.schoolId===s.id).length,s.count);
 assert.ok(timelines.find(t=>t.schoolId===s.id)?.html.length>20);
 const page=fs.readFileSync(dist+s.path,'utf8');assert.ok(page.includes(s.name));
 assert.ok(page.includes('application-timeline'));
 assert.ok(page.includes('program-overview'));
 assert.ok(page.includes('program-details'));
 assert.ok(!page.includes('调研草稿'),'research status leaked into student page');
 assert.ok(!page.includes('本次整合'),'build process leaked into student page');
 assert.ok(!/<p>\s*\|(?:\s*:?-+:?\s*\|)/.test(page),'orphan table separator in '+s.id);
 assert.ok(!page.includes('class="VPSidebar'),'duplicate navigation in '+s.id);
 if(s.pdf){assert.ok(fs.readFileSync('docs/public'+s.pdf).subarray(0,5).toString()==='%PDF-');assert.ok(fs.existsSync(dist+s.pdf));}
 for(const p of programs.filter(p=>p.schoolId===s.id)){
  assert.ok(page.includes(`id="${p.id}"`),p.id+' anchor missing');
  assert.ok(p.sources.length>0,p.id+' missing sources');
  for(const key of ['basic','admission','courses','fees','fit'])assert.ok(p.fields[key]&&p.fields[key]!=='<p>见项目正文</p>\n',p.id+' '+key);
 }
}
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name)]);
let links=0;
for(const f of walk(dist).filter(f=>f.endsWith('.html'))){
 const content=fs.readFileSync(f,'utf8');
 for(const m of content.matchAll(/(?:href|src)="([^"]+)"/g)){
  const u=m[1].replaceAll('&amp;','&');if(/^(https?:|data:|mailto:|#|javascript:)/.test(u))continue;
  const clean=decodeURIComponent(u.split(/[?#]/)[0]);if(!clean)continue;
  let target;
  if(clean.startsWith('/')){assert.ok(clean.startsWith(base),'wrong base '+f+' '+clean);target=path.join(dist,clean.slice(base.length));}else target=path.resolve(path.dirname(f),clean);
  if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  if(!fs.existsSync(target)&&!path.extname(target))target+='.html';
  assert.ok(fs.existsSync(target),'missing local link '+f+' → '+u);links++;
 }
}
for(const f of ['index.html','schools.html','programs.html','timeline.html'])assert.ok(fs.readFileSync(dist+'/'+f,'utf8').includes('升学图谱'));
assert.ok(fs.readFileSync(dist+'/index.html','utf8').includes('下一站'));
const searchFiles=walk(dist+'/assets').filter(x=>/localSearchIndex|zh-CN.*\.js/.test(x));
assert.ok(searchFiles.length>0,'search index missing');
console.log(`PASS: ${catalog.schools.length} schools, ${programs.length} unique entries, source fidelity, report anchors, PDF signatures, ${links} local links, base=${base}, local search index.`);
