/** Date-specific document links from the Ministry of Health's published Attica roster.
 * This returns links to official files, never infers which facility is on duty. */
const SOURCE='https://www.moh.gov.gr/articles/citizen/efhmeries-nosokomeiwn/68-efhmeries-nosokomeiwn-attikhs';
const MONTH=['','ΙΑΝΟΥΑΡΙΟΥ','ΦΕΒΡΟΥΑΡΙΟΥ','ΜΑΡΤΙΟΥ','ΑΠΡΙΛΙΟΥ','ΜΑΙΟΥ','ΙΟΥΝΙΟΥ','ΙΟΥΛΙΟΥ','ΑΥΓΟΥΣΤΟΥ','ΣΕΠΤΕΜΒΡΙΟΥ','ΟΚΤΩΒΡΙΟΥ','ΝΟΕΜΒΡΙΟΥ','ΔΕΚΕΜΒΡΙΟΥ'];
const clean=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=900');
 if(req.method!=='GET'){res.statusCode=405;return res.end(JSON.stringify({error:'Method not allowed'}))}
 const date=String(req.query.date||'');
 const m=/^(20\d\d)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.exec(date);
 if(!m){res.statusCode=400;return res.end(JSON.stringify({error:'Invalid date'}))}
 const label=Number(m[3])+' '+MONTH[Number(m[2])]+' '+m[1];
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),9000);
 try{
  const r=await fetch(SOURCE,{signal:ctrl.signal,headers:{'Accept':'text/html'}});
  if(!r.ok)throw Error('Ministry roster unavailable');
  const html=await r.text();if(html.length>2500000)throw Error('Response too large');
  const files=[],re=/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let match;
  while((match=re.exec(html))!==null){
   const title=clean(match[2]);if(!title.toLocaleUpperCase('el-GR').includes(label))continue;
   let link;try{link=new URL(match[1].replace(/&amp;/g,'&'),SOURCE)}catch{continue}
   if(link.protocol!=='https:'||!['www.moh.gov.gr','moh.gov.gr'].includes(link.hostname))continue;
   if(!files.some(x=>x.url===link.href))files.push({title,url:link.href,format:/\.pdf/i.test(title)?'PDF':'document'});
  }
  files.sort((a,b)=>Number(b.format==='PDF')-Number(a.format==='PDF'));
  res.statusCode=200;return res.end(JSON.stringify({date,source:SOURCE,files:files.slice(0,5),verifiedSource:true,verifiedDutyFacilities:false}));
 }catch{
  res.statusCode=503;return res.end(JSON.stringify({date,source:SOURCE,files:[],verifiedSource:false,verifiedDutyFacilities:false,error:'Could not retrieve published schedule'}));
 }finally{clearTimeout(timer)}
}