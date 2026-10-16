/**
 * EFIMERIA ONE v5 – published hospital rosters / pharmacy duty listings.
 * No OSM hospitals, no invented live status; a result must carry the matching published date.
 * Sources are public pages. Operational status must still be checked by phone.
 */
import {load} from 'cheerio';
const GRMONTHS=['','ΙΑΝ','ΦΕΒ','ΜΑΡ','ΑΠΡ','ΜΑΙ','ΙΟΥΝ','ΙΟΥΛ','ΑΥΓ','ΣΕΠ','ΟΚΤ','ΝΟΕ','ΔΕΚ'];
const SOURCE_H='https://www.thessalonikiguide.gr/efimerevonta-nosokomeia/';
const XO='https://www.xo.gr/efimerevonta-farmakeia/';
const FSTH='https://efimeries.fsth.gr/';
const HOSP={
 '2026-10-16':[
 ['ΑΧΕΠΑ','Κυριακίδη Στίλπωνος 1, Θεσσαλονίκη','2313303111','Θωρακοχειρουργική, Καρδιοχειρουργική'],
 ['Ιπποκράτειο Θεσσαλονίκης','Κωνσταντινουπόλεως 49, Θεσσαλονίκη','2313312000','Αγγειοχειρουργική, Αιμοδυναμική, Γυναικολογική, Καρδιολογική, Μαιευτική, Νεογνολογική, Νευρολογική, Νευροχειρουργική, Οδοντιατρική, Ορθοπαιδική, Ουρολογική, Οφθαλμολογική, Παθολογική, Παιδιατρική, Παιδοορθοπαιδική, Παιδοχειρουργική, Παιδοψυχιατρική, Χειρουργική, ΩΡΛ'],
 ['Άγιος Παύλος','Εθνικής Αντιστάσεως 161, Καλαμαριά','2313304400','Αιμοδυναμική, Καρδιολογική, Νευρολογική, Ορθοπαιδική, Ουρολογική, Παθολογική, Χειρουργική'],
 ['Ψυχιατρικό Νοσοκομείο Θεσσαλονίκης','Λαγκαδά 196, Σταυρούπολη','2313324100','Ψυχιατρική'],
 ['Νοσοκομείο Αφροδισίων & Δερματικών Νόσων','Δελφών 124, Θεσσαλονίκη','2313308800','Δερματολογική (08:00–20:00)']
 ],
 '2026-10-17':[
 ['Γεώργιος Γεννηματάς Θεσσαλονίκης','Εθνικής Αμύνης 41, Θεσσαλονίκη','2313308100','Παιδιατρική, Παιδοορθοπαιδική, Παιδοχειρουργική'],
 ['Ιπποκράτειο Θεσσαλονίκης','Κωνσταντινουπόλεως 49, Θεσσαλονίκη','2313312000','Γυναικολογική, Μαιευτική, Νεογνολογική'],
 ['Γεώργιος Παπανικολάου','Εξοχή, Θεσσαλονίκη','2313307000','Αγγειοχειρουργική, Αιμοδυναμική, Γναθοχειρουργική, Θωρακοχειρουργική, Καρδιολογική, Καρδιοχειρουργική, Νευρολογική, Νευροχειρουργική, Ορθοπαιδική, Παθολογική, Παιδοψυχιατρική, Πλαστική Χειρουργική, Πνευμονολογική, Χειρουργική, ΩΡΛ'],
 ['Ψυχιατρικό Νοσοκομείο Θεσσαλονίκης','Λαγκαδά 196, Σταυρούπολη','2313324100','Ψυχιατρική'],
 ['Άγιος Δημήτριος','Ελένης Ζωγράφου 2, Θεσσαλονίκη','2313322100','Γυναικολογική, Οδοντιατρική, Ουρολογική, Οφθαλμολογική, Παθολογική, Χειρουργική']
 ],
 '2026-10-18':[
 ['ΑΧΕΠΑ','Κυριακίδη Στίλπωνος 1, Θεσσαλονίκη','2313303111','Αγγειοχειρουργική, Αιμοδυναμική, Θωρακοχειρουργική, Καρδιολογική, Καρδιοχειρουργική, Νευρολογική, Νευροχειρουργική, Οφθαλμολογική, Παθολογική, Παιδιατρική, Χειρουργική, Ψυχιατρική, ΩΡΛ'],
 ['Γεώργιος Γεννηματάς Θεσσαλονίκης','Εθνικής Αμύνης 41, Θεσσαλονίκη','2313308100','Καρδιολογική, Ορθοπαιδική, Ουρολογική, Παθολογική, Παιδοορθοπαιδική, Παιδοχειρουργική, Χειρουργική'],
 ['Ιπποκράτειο Θεσσαλονίκης','Κωνσταντινουπόλεως 49, Θεσσαλονίκη','2313312000','Γυναικολογική, Μαιευτική, Νεογνολογική, Παιδοψυχιατρική'],
 ['Ψυχιατρικό Νοσοκομείο Θεσσαλονίκης','Λαγκαδά 196, Σταυρούπολη','2313324100','Οδοντιατρική']
 ],
 '2026-10-19':[
 ['Ιπποκράτειο Θεσσαλονίκης','Κωνσταντινουπόλεως 49, Θεσσαλονίκη','2313312000','Παιδιατρική'],
 ['Άγιος Παύλος','Εθνικής Αντιστάσεως 161, Καλαμαριά','2313304400','Οδοντιατρική'],
 ['Παπαγεωργίου','Περιφερειακή Οδός Θεσσαλονίκης - Νέας Ευκαρπίας','2313323000','Αγγειοχειρουργική, Αιμοδυναμική, Γυναικολογική, Θωρακοχειρουργική, Καρδιολογική, Καρδιοχειρουργική, Μαιευτική, Νεογνολογική, Νευρολογική, Νευροχειρουργική, Ορθοπαιδική, Ουρολογική, Οφθαλμολογική, Παθολογική, Παιδοορθοπαιδική, Παιδοχειρουργική, Πλαστική Χειρουργική, Χειρουργική, Ψυχιατρική, ΩΡΛ'],
 ['Γεώργιος Παπανικολάου','Εξοχή, Θεσσαλονίκη','2313307000','Παιδοψυχιατρική']
 ]};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleUpperCase('el-GR').replace(/\s+/g,' ').trim();
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const dateOK=s=>{if(!/^\d{4}-\d\d-\d\d$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !Number.isNaN(+d)&&d.toISOString().slice(0,10)===s};
const dayMatch=(s,date)=>{const [y,m,d]=date.split('-').map(Number),n=norm(s);return new RegExp('(^|\\D)'+d+'\\s+'+GRMONTHS[m]).test(n)&&n.includes(String(y))};
const formatHospital=(x,date,mode)=>({
 name:x[0],address:x[1],phone:x[2],specialties:x[3].split(', ').map(x=>x.trim()),
 date,startAt:date+'T08:00:00',endAt:new Date(Date.parse(date+'T08:00:00Z')+86400000).toISOString().slice(0,10)+'T08:00:00',
 hours:x[3].includes('Δερματολογική (08:00')?'08:00–20:00':'08:00–08:00 επομένης',
 source:SOURCE_H,sourceKind:mode,liveConfirmed:false,locationApproximate:true
});
const REQUEST={headers:{'Accept':'text/html','User-Agent':'EFIMERIA-ONE / published-duty-info (not an emergency service)'},signal:null};
async function getHTML(url,ms=9500){const u=new URL(url);if(!['www.thessalonikiguide.gr','www.xo.gr'].includes(u.hostname))throw Error('Domain disallowed');
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),ms);
 try{const r=await fetch(url,{headers:REQUEST.headers,signal:ctrl.signal,redirect:'follow'});if(!r.ok)throw Error('Source '+r.status);
 const str=await r.text();if(str.length>3000000)throw Error('Source too large');return str;
 }finally{clearTimeout(timer)}}
function hospitalPage(html,date){
 const $=load(html);$('script,style,noscript,nav,footer,header').remove();
 const root=$('main').get(0)||$('body').get(0);if(!root)return [];
 let stream='';
 const walk=n=>{if(!n)return;if(n.type==='text'){stream+=n.data+' ';return}if(n.type!=='tag'&&n.type!=='root')return;
 const tag=n.name||'';if(['script','style','nav','footer','header','aside'].includes(tag))return;
 if(tag==='h2'||tag==='h3')stream+='\n@@'+tag.toUpperCase()+' ';
 for(const c of n.children||[])walk(c);
 if(['h2','h3','p','br','li'].includes(tag))stream+='\n';
 };walk(root);
 const chunks=stream.split(/@@H2\s+/),entries=[];
 for(const chunk of chunks){const first=chunk.split('\n')[0]||'';if(!dayMatch(first,date)||!norm(first).includes('ΕΦΗΜΕΡΙ'))continue;
  for(const block of chunk.split(/@@H3\s+/).slice(1)){
   const lines=block.split('\n').map(clean).filter(Boolean);const name=lines[0]||'';
   if(!name||/ΕΠΙΛΕΓΜΕΝΑ ΘΕΜΑΤΑ|ΣΥΝΑΥΛΙΑ/.test(norm(name)))continue;
   const text=lines.slice(1).join(' ');
   const addrphone=/([^/]{5,140})\s*\/\s*(2\d{9})/.exec(text);
   const hours=/(\d{1,2}\/\d{1,2})\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/.exec(text);
   if(!addrphone||!hours||hours[1]!==date.slice(8).replace(/^0/,'')+'/'+Number(date.slice(5,7)))continue;
   const after=text.slice((hours.index||0)+hours[0].length).replace(/^\s*\(Επομένης\)\s*/i,'');
   const specs=after.split(',').map(s=>clean(s)).filter(s=>s.length>=3&&s.length<65&&!/ΕΠΙΛΕΓΜΕΝΑ|ΘΕΜΑΤΑ/.test(norm(s))).slice(0,35);
   if(!specs.length)continue;
   entries.push(formatHospital([name,clean(addrphone[1]),addrphone[2],specs.join(', ')],date,'third-party-published-schedule'));
  }
 }
 return entries.slice(0,50);
}
const AREAS={
 menemeni:['menemeni-thessalonikis','eleftherio-kordelio-thessalonikis','ampelokipoi-thessalonikis','eyosmos-thessalonikis'],
 west:['dytiki-thessaloniki','eleftherio-kordelio-thessalonikis'],
 thessaloniki:['dytiki-thessaloniki','thessaloniki'],
 kalamaria:['kalamaria-thessalonikis','thessaloniki'],
 evosmos:['eyosmos-thessalonikis','dytiki-thessaloniki'],
 athens:['athina','athens'],
 patras:['patra'],larissa:['larisa'],kavala:['kavala']
};
const normalizeArea=a=>{const s=norm(a);
 if(/ΜΕΝΕΜ|MENEM/.test(s))return 'menemeni';
 if(/ΕΥΟΣΜ|EVOSM/.test(s))return 'evosmos';
 if(/ΚΟΡΔΕΛ|KORDEL|ΑΜΠΕΛΟΚΗΠ/.test(s))return 'west';
 if(/ΚΑΛΑΜΑΡ|KALAMAR/.test(s))return 'kalamaria';
 if(/ΘΕΣΣΑΛ|THESSAL/.test(s))return 'thessaloniki';
 if(/ΑΘΗΝ|ATHEN|ΑΤΤΙΚ|ATTIC|ΠΕΙΡΑΙ|PIRAE/.test(s))return 'athens';
 if(/ΠΑΤΡ|PATRA/.test(s))return 'patras';
 if(/ΛΑΡΙΣ|LARIS/.test(s))return 'larissa';
 if(/ΚΑΒΑΛ|KAVAL/.test(s))return 'kavala';
 return null};
function pharmacyPage(html,date,source,region){
 const $=load(html);$('script,style,noscript').remove();
 const body=clean($('body').text());
 // The source must explicitly display the requested calendar date. Never treat old duty results as current.
 const months=['','ΙΑΝΟΥΑΡΙΟΥ','ΦΕΒΡΟΥΑΡΙΟΥ','ΜΑΡΤΙΟΥ','ΑΠΡΙΛΙΟΥ','ΜΑΙΟΥ','ΙΟΥΝΙΟΥ','ΙΟΥΛΙΟΥ','ΑΥΓΟΥΣΤΟΥ','ΣΕΠΤΕΜΒΡΙΟΥ','ΟΚΤΩΒΡΙΟΥ','ΝΟΕΜΒΡΙΟΥ','ΔΕΚΕΜΒΡΙΟΥ'];
 const [y,m,d]=date.split('-').map(Number);
 const target=norm(d+' '+months[m]+' '+y);
 const header=norm(body.slice(0,3500));
 if(!header.includes(target))return {status:'stale',entries:[]};
 const entries=[],seen=new Set();
 $('h2,h3').each((_,h)=>{
  const name=clean($(h).text());
  if(!name||name.length<5||name.length>130||/ΕΦΗΜΕΡ|ΠΕΡΙΟΧ|ΑΠΟΤΕΛΕΣΜΑ|ΦΙΛΤΡ/.test(norm(name)))return;
  // Select the smallest ancestor that includes this heading, an address and its duty hours.
  let p=$(h).parent(),card=null;
  for(let depth=0;depth<6&&p.length;depth++,p=p.parent()){
   const txt=clean(p.text());
   if(txt.length>1200)break;
   if(txt.length>name.length+35&&/Εφημερεύει\s*\d{1,2}:\d\d\s*[-–]\s*\d{1,2}:\d\d/i.test(txt)){card=p;break}
  }
  if(!card)return;
  const txt=clean(card.text());
  const full=txt.replace(name,'').trim();
  const dt=full.match(/Εφημερεύει\s*(\d{1,2}:\d\d)\s*[-–]\s*(\d{1,2}:\d\d)/i);
  if(!dt)return;
  let addr=full.slice(0,full.indexOf('Εφημερεύει')).replace(/^(?:ΑΝΟΙΧΤΟ ΤΩΡΑ|ΑNOIXTO ΤΩΡΑ)\s*/i,'');
  addr=addr.replace(/\s*\(?Δρομολόγηση\)?[\s\S]*$/i,'').replace(/\s*\(?ΔΡΟΜΟΛΟΓΗΣΗ\)?[\s\S]*$/i,'').replace(/^(?:Image:\s*Λογότυπο\s*)/i,'').slice(0,180).trim();
  if(addr.length<5||!/[0-9]/.test(addr))return;
  const tel=card.find('a[href^="tel:"]').first().attr('href')?.replace(/^tel:/,'').replace(/[^+\d]/g,'')||'';
  const key=norm(name)+'|'+norm(addr);if(seen.has(key))return;seen.add(key);
  entries.push({name,address:addr,phone:tel,hours:dt[1]+'–'+dt[2],specialties:[],date,
    source,sourceKind:'third-party-pharmacy-directory',liveConfirmed:false,region});
 });
 return {status:entries.length?'published':'unparsed',entries:entries.slice(0,80)};
}
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=300');
 if(req.method!=='GET'){res.statusCode=405;return res.end(JSON.stringify({error:'Only GET'}))}
 const type=req.query.type==='pharmacy'?'pharmacy':'hospital',date=String(req.query.date||''),area=String(req.query.area||'Μενεμένη').slice(0,100);
 if(!dateOK(date)){res.statusCode=400;return res.end(JSON.stringify({error:'Invalid date'}))}
 const region=normalizeArea(area),output={date,area,region,type,entries:[],status:'unavailable',source:null,sourceLabel:null,liveConfirmed:false,disclaimer:'Published schedule only. Always call before travelling.'};
 if(type==='hospital'){
   if(!['thessaloniki','menemeni','west','evosmos','kalamaria'].includes(region)){output.status='unsupported';return res.end(JSON.stringify(output))}
   try{
     const found=hospitalPage(await getHTML(SOURCE_H),date);
     if(found.length){output.entries=found;output.status='published';output.source=SOURCE_H;output.sourceLabel='ThessalonikiGuide (third-party)';return res.end(JSON.stringify(output))}
   }catch{}
   if(HOSP[date]){
     output.entries=HOSP[date].map(x=>formatHospital(x,date,'dated-source-snapshot'));
     output.status='published_snapshot';output.source=SOURCE_H;output.sourceLabel='ThessalonikiGuide · archived dated extract';
     output.disclaimer='Dated published roster snapshot (17 Oct 2026). May have been revised; always call first.';
     return res.end(JSON.stringify(output));
   }
   output.status='unavailable';output.source=SOURCE_H;return res.end(JSON.stringify(output));
 }
 const pages=AREAS[region];if(!pages){output.status='unsupported';return res.end(JSON.stringify(output))}
 // Current or previous duty-day only: independent directory may not support arbitrary future dates.
 const todayParts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Athens',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
 const today=todayParts.year+'-'+todayParts.month+'-'+todayParts.day;
 const previous=new Date(Date.parse(today+'T00:00:00Z')-86400000).toISOString().slice(0,10);
 if(date!==today&&date!==previous){output.status='date_unsupported';return res.end(JSON.stringify(output))}
 const urls=pages.slice(0,3).map(s=>XO+s+'/'),results=await Promise.allSettled(urls.map(u=>getHTML(u,7500).then(h=>pharmacyPage(h,date,u,region))));
 const seen=new Set();let bad=0;
 for(const r of results){if(r.status!=='fulfilled'){bad++;continue}for(const e of r.value.entries||[]){const k=norm(e.name)+'|'+norm(e.address);if(!seen.has(k)){seen.add(k);output.entries.push(e)}}}
 if(output.entries.length){output.status='published';output.source=FSTH;output.sourceLabel='xo.gr third-party listings; verify against FSTH';output.disclaimer='Third-party listed duty times, not official confirmation or real-time open status. Call before travelling.'}
 else output.status=bad===results.length?'unavailable':'no_verified_entries';
 return res.end(JSON.stringify(output));
}
