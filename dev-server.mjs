import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {join,normalize,extname} from 'node:path';
import nearby from './api/nearby.js';
import places from './api/places.js';
import reverse from './api/reverse.js';
import duty from './api/duty.js';
import pharmacies from './api/pharmacies.js';
const root=process.cwd(), types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'};
const port=Number(process.env.PORT||3000);
http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost:'+port);
 if(u.pathname.startsWith('/api/')){
  req.query=Object.fromEntries(u.searchParams);return (u.pathname==='/api/nearby'?nearby:u.pathname==='/api/places'?places:u.pathname==='/api/reverse'?reverse:u.pathname==='/api/duty'?duty:u.pathname==='/api/pharmacies'?pharmacies:(rq,rs)=>{rs.statusCode=404;rs.end();})(req,res);
 }
 const p=normalize(join(root,decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname)));
 if(!p.startsWith(root)){res.statusCode=403;return res.end();}
 try{if(!(await stat(p)).isFile())throw Error();res.setHeader('Content-Type',types[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.statusCode=404;res.end('Not found');}
}).listen(port,()=>console.log('Efimeria One → http://localhost:'+port));
