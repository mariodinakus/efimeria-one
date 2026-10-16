/** Approximate label for a consented GPS fix; never changes the coordinates. */
const send=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.end(JSON.stringify(data));};
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 const lat=Number(req.query.lat),lon=Number(req.query.lon);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<34||lat>42.6||lon<19||lon>30)return send(res,400,{error:'Invalid coordinates'});
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
 try{
  const url='https://photon.komoot.io/reverse?'+new URLSearchParams({lat:String(lat),lon:String(lon),lang:'en'});
  const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw Error();
  const data=await r.json();const f=(data.features||[]).find(x=>x.properties?.countrycode==='GR');
  const p=f?.properties||{};
  const names=[p.district,p.city,p.county,p.state].filter((v,i,a)=>v&&a.indexOf(v)===i);
  return send(res,200,{label:names.slice(0,3).join(', ')||null,approximate:true});
 }catch{return send(res,503,{label:null});}finally{clearTimeout(timer)}
}
