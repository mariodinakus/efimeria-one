/** City/town geocoding: bounded to Greece; no storage of personal coordinates. */
const send=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control',status===200?'public, s-maxage=86400':'no-store');res.end(JSON.stringify(data));};
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 const q=String(req.query.q||'').trim().slice(0,80);
 const lang=req.query.lang==='el'?'el':'en';
 if(q.length<2||!/^[\p{L}\p{M}\s'.,-]+$/u.test(q))return send(res,400,{error:'Invalid location query'});
 const c=new AbortController(), timer=setTimeout(()=>c.abort(),6500);
 try{
  const url='https://photon.komoot.io/api/?'+new URLSearchParams({q:q+', Greece',limit:'8',lang});
  const r=await fetch(url,{signal:c.signal,headers:{'Accept':'application/json'}});
  if(!r.ok)throw new Error('Location service unavailable');
  const p=await r.json();
  const places=(p.features||[]).filter(x=>x.properties?.countrycode==='GR'||x.properties?.country==='Greece'||x.properties?.country==='Ελλάδα').map(x=>({label:[x.properties.name,x.properties.city,x.properties.state].filter((v,i,a)=>v&&a.indexOf(v)===i).join(', '),lat:x.geometry.coordinates[1],lon:x.geometry.coordinates[0]})).slice(0,6);
  return send(res,200,{places});
 }catch{ return send(res,503,{error:'Location search temporarily unavailable'});}
 finally{clearTimeout(timer);}
}
