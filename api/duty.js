import {parseAtticaPdf} from '../lib/pdf-roster.js';
import {parseThessWorkbook} from '../lib/thess-roster.js';
import {load} from 'cheerio';
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

const MONTH_NAMES=['','ΙΑΝΟΥΑΡΙΟΣ','ΦΕΒΡΟΥΑΡΙΟΣ','ΜΑΡΤΙΟΣ','ΑΠΡΙΛΙΟΣ','ΜΑΙΟΣ','ΙΟΥΝΙΟΣ','ΙΟΥΛΙΟΣ','ΑΥΓΟΥΣΤΟΣ','ΣΕΠΤΕΜΒΡΙΟΣ','ΟΚΤΩΒΡΙΟΣ','ΝΟΕΜΒΡΙΟΣ','ΔΕΚΕΜΒΡΙΟΣ'];
async function thessalonikiRoster(date){
 const [year,month]=date.split('-').map(Number);
 const category='https://www.3ype.gr/category/efimeries/';
 const r=await timeoutFetch(category,8500,{headers:{Accept:'text/html'}});
 if(!r.ok)throw Error('3rd District category unavailable');
 const $=load(await r.text()),needle=norm(MONTH_NAMES[month]+' '+year);
 const articles=$('a[href]').toArray().map(x=>({text:norm($(x).text()),href:$(x).attr('href')}))
  .filter(x=>x.text.includes(needle)&&x.href).map(x=>new URL(x.href,category))
  .filter(u=>u.hostname==='www.3ype.gr'||u.hostname==='3ype.gr');
 if(!articles.length)return {coverage:true,status:'not_published',entries:[],date,source:category};
 const a=await timeoutFetch(articles[0].href,8500);
 if(!a.ok)throw Error('Monthly duty schedule page unavailable');
 const j=load(await a.text());
 const links=j('a[href]').toArray().map(el=>j(el).attr('href')).filter(Boolean);
 const bookLink=links.map(l=>{try{return new URL(l,articles[0].href)}catch{return null}})
  .find(u=>u&&/^(www\.)?3ype\.gr$/.test(u.hostname)&&/\.xlsx(?:$|\?)/i.test(u.pathname));
 if(!bookLink)return {coverage:true,status:'not_published',entries:[],date,source:articles[0].href};
 const download=await timeoutFetch(bookLink.href,11000);
 if(!download.ok)throw Error('XLSX unavailable');
 const buffer=Buffer.from(await download.arrayBuffer());
 if(buffer.length>6000000||buffer.length<1000||buffer[0]!==0x50||buffer[1]!==0x4b)throw Error('Invalid XLSX');
 const ExcelJS=(await import('exceljs')).default;
 const workbook=new ExcelJS.Workbook();
 await workbook.xlsx.load(buffer);
 const entries=parseThessWorkbook(workbook,{date,source:bookLink.href});
 return {coverage:true,status:'published',entries,date,source:bookLink.href,extractedAt:new Date().toISOString(),notice:'Official monthly schedule, not confirmation of real-time availability.'}
}

export default async function handler(req,res){
 if(req.method!=='GET')return response(res,405,{error:'Method not allowed'});
 const date=String(req.query.date||''),region=['attica','thessaloniki'].includes(req.query.region)?req.query.region:'unknown';
 if(!safeDate(date)||date.slice(0,4)<'2024')return response(res,400,{error:'Invalid duty date'});
 if(region==='thessaloniki'){
 try{return response(res,200,await thessalonikiRoster(date))}
 catch(e){return response(res,503,{coverage:true,status:'unavailable',entries:[],date,source:'https://www.3ype.gr/category/efimeries/',error:String(e.message||'Schedule unavailable').slice(0,120)})}
}
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
