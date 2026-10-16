/** Bilingual Greek place search (geocoding is not a verified healthcare service). */
const send=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control',status===200?'public, s-maxage=3600, stale-while-revalidate=86400':'no-store');res.end(JSON.stringify(data));};
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 const q=String(req.query.q||'').trim().slice(0,90);
 const lang=req.query.lang==='el'?'el':'en';
 if(q.length<2||!/^[\p{L}\p{M}\s'.,-]+$/u.test(q))return send(res,400,{error:'Invalid location query'});
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7800);
 try{
  // Restrict at the API, rather than appending ', Greece' to a local neighborhood name.
  const url='https://photon.komoot.io/api/?'+new URLSearchParams({q,limit:'14',lang:lang==='el'?'en':lang,countrycode:'GR',bbox:'19.3,34.5,29.8,41.9'});
  const r=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
  if(!r.ok)throw Error('Geocoding unavailable');
  const data=await r.json();
  const places=(data.features||[]).filter(f=>f.properties?.countrycode==='GR')
   .filter(f=>Array.isArray(f.geometry?.coordinates)&&f.geometry.coordinates.length>=2)
   .map(f=>{const p=f.properties;return {label:[p.name,p.district,p.city,p.state].filter((v,i,a)=>v&&a.indexOf(v)===i).join(', '),lat:f.geometry.coordinates[1],lon:f.geometry.coordinates[0],priority:p.osm_key==='place'?0:p.osm_key==='boundary'?1:2}})
   .filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon))
   .sort((a,b)=>a.priority-b.priority).slice(0,8).map(({priority,...p})=>p);
  return send(res,200,{places});
 }catch{return send(res,503,{error:'Location search temporarily unavailable'});}finally{clearTimeout(timer)}
}
