import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({html: false, linkify: true});
const readableLinks = s => s.replace(/\[([\s*]*S\d+[^\]]*)\](?=\(https?:\/\/)/g, (_,label) => '['+(label.replace(/\*\*/g,'').replace(/^\s*S\d+\s*[：:]?\s*/,'').trim()||'官网')+']');
export const plain = s => readableLinks(s.replace(/\[\s*\**S\d+\**\s*\]\([^)]*\)/g, '')).replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<br\s*\/?>/gi, ' ').replace(/[`*_#]/g, '').trim();
export const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const missing = /官网未|未公开|未公布|尚未|待核|待发布|未单列|未单独|未找到|未检索到|需核验/;
const substantive = /\d+(?:\.\d+)?\s*(?:万元|元|万|人|分|%|学分|个月)|(?<!\d)\d{1,2}(?:\.\d+)?\s*年|(?:USD|HKD|SGD|AUD|GBP|US\$|HK\$|S\$|£|\$)\s*[\d,]+|\b(?:101|201|204|301|302|303|396|431|432|408)\b|不要求|无需|豁免|可选|不接收|仅接收|仅限|必须|须具备|工作经验|全日制|不适用|Master|MSc|MEng|MFin/;

export function programTitle(value) {
  return plain(value)
    .replace(/\s*[/／]\s*Elite Master of Finance（英文称谓待核对完整官方版本）/g, '')
    .replace(/(?:\s*[/／]\s*|[；;]\s*)?(?:官方)?英文(?:正式)?(?:项目全称|项目名|专业名称)[：:]?\s*(?:官网未公开|待官网确认)/g, '')
    .replace(/[（(]\s*[）)]/g, '').trim();
}

export function programTags(title, focus) {
  const text=title+' '+focus;
  // Risk/asset management alone does not make a management/operations program.
  const management=text.replace(/(?:风险|風險|资产|資產|财富|財富|投资|投資)管理|(?:Risk|Asset|Wealth|Investment) Management/gi, '');
  return [
    [/金融工程|金融数学|量化|数量金融|Financial Engineering|Mathematics in Finance|Quantitative Finance/i,'量化金融',text],
    [/金融|Finance|Financ|资产评估|会计|Accounting|投资|投資|Investment/i,'金融与金融科技',text],
    [/统计|統計|数学|數學|Statistics|Statistical|Biostat|Mathematics|Mathematical|科学计算|Scientific Computing/i,'统计与应用数学',text],
    [/数据|數據|数智|數智|商业分析|商务分析|Data|Analytics|人工智能|机器学习|Machine Learning|计算机|Computer Science|Artificial Intelligence/i,'数据与商业分析',text],
    [/经济|經濟|Economics|Econometric/i,'经济与计量',text],
    [/管理|运筹|運籌|工业工程|工业智能|智慧物流|Management|Operations|Industrial Engineering/i,'管理与运筹',management],
    [/精算|保险|保險|风险|風險|Actuarial|Insurance|Risk/i,'精算与风险管理',text],
  ].filter(([re,,value])=>re.test(value)).map(([,tag])=>tag);
}

// Omit standalone missing-data statements, but retain mixed factual statements and
// eligibility restrictions verbatim. Canonical reports remain byte-for-byte intact.
export function studentText(value) {
  const protectedText = [];
  let text = value.replace(/入学季参考往届秋季，2028实际报到日期官网未公开/g, '秋季入学（参考往届）')
    .replace(/；英文授课／英文正式学位名：待核验（商业分析常用 Business Analytics；全球管理常用 Master in Management, MiM）/g, '')
    .replace(/\[[^\]]*\]\(https?:\/\/[^\s)]+\)/g, x => `LINKTOKEN${protectedText.push(x)-1}END`);
  text = text.split(/(?<=[。！？])(?=[^）)])/u).filter(sentence => {
    const clean = plain(sentence).replace(/LINKTOKEN\d+END/g, '').replace(/(?:检索|核验|更新)(?:日期)?[：:]?\s*20\d\d-\d\d-\d\d/g, '').trim();
    if (!missing.test(clean)) return true;
    if (substantive.test(clean)) return true;
    // A missing-data-only sentence has no positive proposition before the caveat.
    return /包含|包括|设有|提供|强调|侧重|课程为|适合|要求(?:达到|提供|具备|提交|至少|本科|学士)|接受|采用|需提交|可申请|毕业生进入|就业率(?:为|达|约)|学费为|学制为/.test(clean);
  }).join('');
  return text.replace(/LINKTOKEN(\d+)END/g, (_,i) => protectedText[+i]).trim();
}

export function render(value) {
  const readable=readableLinks(value);
  return md.render(readable.replace(/<br\s*\/?>/gi, ' ')).replace(/href="(https?:[^\"]+)"/g, 'href="$1" target="_blank" rel="noopener noreferrer"');
}

export function classify(label) {
  if (/项目\s*ID|官方依据|官方来源|核验状态|历史培养方案校验/.test(label)) return 'archive';
  if (/适配/.test(label)) return 'fit';
  if (/费用|学费|奖|资助|就业|毕业去向|去向/.test(label)) return 'fees';
  if (/课程|培养|先修|技能|能力|实践|编程|工具|研究方向/.test(label) && !/基本情况/.test(label)) return 'courses';
  if (/日期|时间|批次节点/.test(label) && !/招生|初试|申请.*要求/.test(label)) return 'dates';
  if (/招生|申请|录取|初试|复试|竞争|材料|考核|选拔|英语|语言|考试|GPA/.test(label)) return 'admission';
  if (/基本|院系|名称|中英文|学位|学制|城市|校区|入学季/.test(label)) return 'basic';
  return 'other';
}

export function groupFields(fields, programId='') {
  const groups = Object.fromEntries(['basic','fit','courses','admission','fees','dates','other'].map(k=>[k,[]]));
  for (const f of fields) {
    const key=classify(f.label);
    let value=studentText(f.value);
    if (/^cn-pku-p01[1-4]$/.test(programId)) value=value.replace('深圳；其中p014第1年英国、第2—3年深圳', programId==='cn-pku-p014'?'第1年英国，第2—3年深圳':'深圳');
    if (key!=='archive' && plain(value).length>2) groups[key].push({...f,value});
  }
  return groups;
}

export function renderFields(fields) {
  return fields.map(f => render(`**${f.label.replace(/（严格区分计划和实际录取）|（重点核对）|与官网状态/g,'')}**：${f.value}`)).join('\n');
}

export function sourceLinks(body) {
  const links = new Map();
  for (const match of body.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)) {
    const title=plain(match[1]).replace(/^\s*S\d+[：:]?\s*/, '').trim();
    if (!links.has(match[2]) || title.length>(links.get(match[2])||'').length) links.set(match[2],title);
  }
  return links;
}

export function timelineText(text) {
  // Keep each table's header and delimiter together. Source tables use different
  // date-column positions, so inspect the header instead of assuming column 2.
  const lines=text.split('\n'),output=[];
  for(let i=0;i<lines.length;i++) {
    if(lines[i].trim().startsWith('|') && /^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(lines[i+1]||'')) {
      const header=lines[i],separator=lines[++i];
      const dateColumn=header.split('|').slice(1,-1).findIndex(c=>/日期|时间/.test(c));
      const rows=[];
      while(lines[i+1]?.trim().startsWith('|')) {
        const row=lines[++i],date=plain(row.split('|').slice(1,-1)[dateColumn]||'');
        if(dateColumn>=0 && /^(?:官网未|尚未|待核|未公开)/.test(date) && !/\d{1,2}\s*[月日:/.-]/.test(date)) continue;
        rows.push(row);
      }
      if(rows.length) output.push(header,separator,...rows);
    } else if(!/^\*\*.*(?:不适用|官网未公开).*\*\*$/.test(lines[i])) output.push(lines[i]);
  }
  return output.join('\n').replace(/^###\s+4\.\d+\s+/gm, '### ');
}

export function schoolPage(s, entries, content, getSection, alumni) {
  const intro = [...new Set(entries.flatMap(p=>p.tags))].join('、');
  const lines = [`[← 院校导航](/schools.html?region=${s.region})`, `# ${s.name}`, `<p class="school-english">${escape(s.school_name_en)}</p>`,
    `<div class="school-facts"><span>${escape(s.country_or_region)}</span><span>${entries.length} 个项目 / 培养方向</span><span>面向 ${s.target_intake_year} 年入学准备</span></div>`,
    `从${intro}等方向了解这所大学。先用下表找方向，再展开项目的课程、申请与费用信息。`,
    `<p class="edition-note">招生资料参考 ${s.reference_intake_years.join(' / ')} 年入学批次，具体日期与费用保留各自年份。请按目标入学届别查看招生通知。资料检索：${s.last_verified_on}。</p>`,
    `## 项目速览 {#program-overview}`];
  const overview=['| 项目 | 院系与学制 | 培养重点 |', '|---|---|---|'];
  for (const p of entries) {
    const short=programTitle(p.row?.[0]||p.title).replace(new RegExp(s.id+'-p\\d{3}','g'),'').replace(/^p\d{3}\s*/,'').trim();
    overview.push(`| [${short.replaceAll('|','／')}](#${p.id}) | ${studentText(p.row?.[1]||'')}<br>${studentText(p.row?.[2]||'')} | ${studentText(p.row?.[3]||p.focus)} |`);
  }
  lines.push(overview.join('\n'));
  const common=[...getSection(content,1).matchAll(/^[-*]\s+\*\*([^*\n]+)\*\*\s*[：:]?\s*([\s\S]*?)(?=^[-*]\s+\*\*|$(?![\s\S]))/gm)]
    .filter(x=>/语言|英语|费用|生活|资助|材料|学历|本科.*对照|最低|招生渠道|统考通用|工作经验/.test(x[1]))
    .map(x=>({label:x[1].replace(/[：:]$/,''),value:studentText(x[2].trim())})).filter(x=>x.value);
  if(common.length) lines.push('## 申请前要知道 {#before-applying}', '<details class="program-detail"><summary>学校通用要求与预算参考</summary>\n\n'+renderFields(common)+'\n</details>');
  const related=alumni.filter(a=>a.schoolIds.includes(s.id));
  if(related.length) {
    lines.push('## 学长学姐的选择 {#alumni}', '看看统计学院同学的升学经历与准备方法。');
    for(const a of related) {
      const offer = a.schoolId!==s.id && !a.jointSchoolIds?.includes(s.id);
      lines.push(`- [**${a.name}** · ${a.cohort} · ${a.major}](/alumni.html#${a.id})：${offer ? a.offers.filter(o=>o.schoolId===s.id).map(o=>o.school+'（'+o.program+'）').join('；')+'，获录取。最终选择'+a.destination : a.destination+'（'+a.route+'）'}。[阅读学院专访](${a.source})`);
    }
  }
  lines.push('## 项目详解 {#program-details}');
  for (const p of entries) {
    const g=p.groups;
    lines.push(`### ${p.title} {#${p.id}}`, `<div class="program-lead">\n\n${renderFields(g.fit)||render(p.focus)}\n</div>`,
      `<div class="program-facts">\n\n${renderFields(g.basic)||render(p.degree)}\n</div>`);
    for(const [keys,label] of [[['courses'],'学什么 · 课程与能力'],[['admission','dates'],'怎么申请 · 条件、考试与日期'],[['fees'],'费用与毕业去向'],[['other'],'其他项目信息']]) {
      const fields=keys.flatMap(k=>g[k]);
      if(fields.length) lines.push(`<details class="program-detail"><summary>${label}</summary>\n\n${renderFields(fields)}\n</details>`);
    }
    lines.push(`<div class="program-compare">\n\n[加入跨校对比 →](/programs.html?add=${p.id})\n\n</div>`);
  }
  const timeline=timelineText(getSection(content,4));
  lines.push('## 申请时间线 {#application-timeline}', '以下是对应年份的申请节点；2028 年入学准备可结合[全站时间线](/timeline.html)安排。', timeline);
  const links=sourceLinks(content);
  lines.push('## 官方链接与延伸阅读 {#official-sources}', `<details class="source-directory"><summary>项目官网、招生与课程链接（${links.size} 项）</summary>\n`);
  for(const [url,title] of links) lines.push(`- [${title||new URL(url).hostname}](${url})`);
  lines.push('\n</details>', '<SchoolDownloads />');
  return readableLinks(lines.join('\n\n'));
}
