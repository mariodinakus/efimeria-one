/* Publicly rendered duty LISTINGS from an independent third-party source.
 * Not an official pharmacy association; always display provenance and require date match. */
import {load} from 'cheerio';
const SOURCE='https://www.iefimeria.gr';
const PAGES={
 thessaloniki:'/efimereyonta-farmakeia/thessaloniki/thessalonikh',
 athens:'/efimereyonta-farmakeia/athina/athhna',
 kordelio:'/efimereyonta-farmakeia/thessaloniki/eleftherio-kordelio',
 evosmos:'/efimereyonta-farmakeia/thessaloniki/eyosmos',
 kalamaria:'/efimereyonta-farmakeia/thessaloniki/kalamaria',
 patras:'/efimereyonta-farmakeia/patra',
 larissa:'/efimereyonta-farmakeia/larisa',
 kavala:'/efimereyonta-farmakeia/kavala'
};
const MONTHS=['','ΙΑΝΟΥΑΡΙΟΥ','ΦΕΒΡΟΥΑΡΙΟΥ','ΜΑΡΤΙΟΥ','ΑΠΡΙΛΙΟΥ','ΜΑΙΟΥ','ΙΟΥΝΙΟΥ','ΙΟΥΛΙΟΥ','ΑΥΓΟΥΣΤΟΥ','ΣΕΠΤΕΜΒΡΙΟΥ','ΟΚΤΩΒΡΙΟΥ','ΝΟΕΜΒΡΙΟΥ','ΔΕΚΕΜΒΡΙΟΥ'];
const normalize=s=>String(s||'').toLocaleUpperCase('el-GR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
const respond=(r,status,data)=>{r.statusCode=status;r.setHeader('Content-Type','application/json; charset=utf-8');r.setHeader('Cache-Control',status===200?'public, s-maxage=300':'no-store');r.end(JSON.stringify(data))};
const today=()=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Athens',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day};
export default async function handler(req,res){
 if(req.method!=='GET')return respond(res,405,{error:'Method not allowed'});
 const city=String(req.query.city||''),date=String(req.query.date||''),path=PAGES[city];
 if(!path)return respond(res,200,{status:'unsupported_area',entries:[],coverage:false});
 if(date!==today())return respond(res,200,{status:'date_unavailable',entries:[],coverage:true,date,reason:'Source only publishes current daily listings'});
 const url=SOURCE+path;
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(10000),headers:{Accept:'text/html'}});
  if(!r.ok)throw Error('Source unavailable');
  const html=await r.text();if(html.length>2500000)throw Error('Source too large');
  const $=load(html),body=normalize($('body').text().slice(0,8000));
  const [yy,mm,dd]=date.split('-').map(Number);
  const target=normalize(dd+' '+MONTHS[mm]+' '+yy);
  // No silent reuse of a cached / previously published day's roster.
  if(!body.includes(target))return respond(res,200,{coverage:true,status:'stale_source',entries:[],date,source:url});
  const entries=[],seen=new Set();
  $('a[href*="/farmakeio/"]').each((_,a)=>{
   const el=$(a),name=el.text().replace(/\s+/g,' ').trim();
   if(!name||name.length>120)return;
   const container=el.closest('li,article,.pharmacy-card,.pharmacy-item,.card');
   const text=(container.length?container:el.parent().parent()).text().replace(/\s+/g,' ').trim();
   const timeMatch=text.match(/(?:\b(?:[01]?\d|2[0-3]):[0-5]\d\b[\s\S]{0,8}ΕΩΣ[\s\S]{0,85}|8:00 ΠΡΩΪ ΕΩΣ[\s\S]{0,60})/i);
   if(!timeMatch)return;
   const before=text.substring(text.indexOf(name)+name.length,timeMatch.index).replace(/\bΟδηγίες\b|\bΚλήση\b/g,'').trim().slice(0,180);
   const hours=timeMatch[0].trim().replace(/\s+/g,' ');
   if(!before||before.length<6)return;
   const id=name+'|'+before;if(seen.has(id))return;seen.add(id);
   const phoneHref=container.find('a[href^="tel:"]').first().attr('href')||'';
   const directions=container.find('a[href*="google.com/maps"],a[href*="maps/dir"]').first().attr('href');
   let lat=null,lon=null;
   if(directions)try{const dest=new URL(directions,url).searchParams.get('destination')||'';
    const pos=dest.match(/^\\s*(-?\\d{1,2}\\.\\d+)\\s*,\\s*(-?\\d{1,3}\\.\\d+)\\s*$/);
    if(pos){const a=Number(pos[1]),b=Number(pos[2]);if(a>=34&&a<=42.6&&b>=19&&b<=30){lat=a;lon=b}}
   }catch{}
   entries.push({name,address:before,hours,phone:phoneHref.replace(/^tel:/,''),lat,lon,coordinateSource:lat!==null?'source-directions':null,
    source:url,sourceType:'third-party-listing',verifiedLive:false,date,area:city});
  });
  if(!entries.length)return respond(res,200,{coverage:true,status:'parse_unavailable',entries:[],date,source:url});
  return respond(res,200,{coverage:true,status:'reported',entries:entries.slice(0,120),date,source:url,extractedAt:new Date().toISOString(),notice:'Independent site reports on-duty listings. Not official and not confirmed currently open. Call before travelling.'})
 }catch(e){return respond(res,503,{coverage:true,status:'unavailable',entries:[],date,source:url,error:String(e.message).slice(0,120)})}
}
