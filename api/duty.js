import {parseAtticaPdf} from '../lib/pdf-roster.js';
const MINISTRY='https://www.moh.gov.gr/articles/citizen/efhmeries-nosokomeiwn/68-efhmeries-nosokomeiwn-attikhs';
const MONTH=['','ΙΑΝΟΥΑΡΙΟΥ','ΦΕΒΡΟΥΑΡΙΟΥ','ΜΑΡΤΙΟΥ','ΑΠΡΙΛΙΟΥ','ΜΑΙΟΥ','ΙΟΥΝΙΟΥ','ΙΟΥΛΙΟΥ','ΑΥΓΟΥΣΤΟΥ','ΣΕΠΤΕΜΒΡΙΟΥ','ΟΚΤΩΒΡΙΟΥ','ΝΟΕΜΒΡΙΟΥ','ΔΕΚΕΜΒΡΙΟΥ'];
const norm=s=>String(s||'').toLocaleUpperCase('el-GR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
const response=(res,status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control',status===200?'public, s-maxage=600, stale-while-revalidate=600':'no-store');res.end(JSON.stringify(body));};
const safeDate=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !Number.isNaN(+d)&&d.toISOString().slice(0,10)===s};
const timeoutFetch=(url,ms,opt={})=>fetch(url,{...opt,signal:AbortSignal.timeout(ms)});
function findPdf(html,date){
 const [y,m,d]=date.split('-').map(Number);
 const needle=norm(d+' '+MONTH[m]+' '+y);
 const links=[...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
 const candidates=[];
 for(const match of links){
  const label=norm(match[2]);if(!label.includes(needle)||!label.includes('.PDF'))continue;
  let url;try{url=new URL(match[1].replace(/&amp;/g,'&'),MINISTRY)}catch{continue}
  if(url.protocol!=='https:'||!['www.moh.gov.gr','moh.gov.gr'].includes(url.hostname))continue;
  candidates.push({url:url.href,label,corrected:/ΟΡΘΗ|ΕΠΑΝΑΚΟΙΝΟΠΟΙΗΣΗ/.test(label)});
 }
 candidates.sort((a,b)=>Number(b.corrected)-Number(a.corrected));
 return candidates[0]?.url||null;
}
async function readPdf(url){
 const r=await timeoutFetch(url,10500,{headers:{Accept:'application/pdf'}});
 if(!r.ok)throw Error('PDF unavailable');
 const data=new Uint8Array(await r.arrayBuffer());
 if(data.byteLength>3500000||data.byteLength<1000||String.fromCharCode(...data.subarray(0,4))!=='%PDF')throw Error('Invalid PDF content');
 const lib=await import('pdfjs-dist/legacy/build/pdf.js');const pdfjs=lib.getDocument?lib:lib.default;
 const task=pdfjs.getDocument({data,disableFontFace:true,useSystemFonts:true,isEvalSupported:false});
 const doc=await task.promise,pages=[];
 try{
  for(let i=1;i<=Math.min(doc.numPages,10);i++){
   const page=await doc.getPage(i),viewport=page.getViewport({scale:1}),txt=await page.getTextContent();
   pages.push({width:viewport.width,items:txt.items});
  }
 }finally{await doc.destroy()}
 return pages;
}
export default async function handler(req,res){
 if(req.method!=='GET')return response(res,405,{error:'Method not allowed'});
 const date=String(req.query.date||''),region=req.query.region==='attica'?'attica':'unknown';
 if(!safeDate(date)||date.slice(0,4)<'2024')return response(res,400,{error:'Invalid duty date'});
 if(region!=='attica')return response(res,200,{coverage:false,status:'unsupported_region',entries:[],date});
 try{
  const htmlRes=await timeoutFetch(MINISTRY,10000,{headers:{Accept:'text/html'}});
  if(!htmlRes.ok)throw Error('Published source unavailable');
  const url=findPdf(await htmlRes.text(),date);
  if(!url)return response(res,200,{coverage:true,status:'not_published',entries:[],date,source:MINISTRY});
  const pages=await readPdf(url);
  const entries=parseAtticaPdf(pages,{date,source:url});
  return response(res,200,{coverage:true,status:'published',entries,date,source:url,extractedAt:new Date().toISOString(),notice:'Official published roster, not proof of current operation. Confirm with provider.'});
 }catch(e){return response(res,503,{coverage:true,status:'unavailable',entries:[],date,source:MINISTRY,error:String(e.message||'Extraction unavailable').slice(0,130)})}
}
