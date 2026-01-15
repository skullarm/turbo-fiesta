/* ===========================
   FIXED MSE + MP4BOX CLIENT
   =========================== */

let d=document,w,u,h=[],n=new TextDecoder(),p=new Map(),a=0,si=0,dl=!!0,dld=!!0,c=!!0,svrInd=0,atmps=4,vdld=!!0,
mpbU='https://cdn.jsdelivr.net/npm/mp4box@latest/dist/mp4box.all.min.js',
ge=i=>d.getElementById(i),pdfdl=!!0,getwkr=!!0,mp4boxLoaded=!!0,mp4box;

const svrs=['osric','wit','offal','bilboes'];
const MP4_MSE_THRESHOLD=50*1024*1024;
const SEG_QUEUE_LIMIT=50;
const segOptions={ nbSamples: 250 };

/* ========= DOM SETUP (UNCHANGED) ========= */

d.body.innerHTML = `...`; // ⬅️ your original DOM HTML unchanged

/* ========= UTILITIES (UNCHANGED) ========= */

const mlog = er=>{
 let dd=new Date();
 let cur=(localStorage.getItem('error')||'')+
 `\n${dd.toISOString()} ${JSON.stringify(er).slice(0,200)}`;
 localStorage.setItem('error',cur.slice(-10000));
};

/* ========= MP4BOX LOADER ========= */

async function ldmp4box(){
 if(mp4boxLoaded) return;
 try{
  const b=new Blob([localStorage.getItem('mp4box')||''],{type:'application/javascript'});
  const url=URL.createObjectURL(b);
  const mod=await import(url);
  mp4box=mod.default||mod;
  mp4boxLoaded=!!1;
  mlog("mp4box loaded");
 }catch(e){ mlog(e); throw e; }
}

/* ========= MSE SETUP ========= */

function setUpMSE(r){
 return new Promise((resolve,reject)=>{
  r.mse=new MediaSource();
  r.vid.src=URL.createObjectURL(r.mse);
  r.vid.controls=true;

  r.mse.addEventListener("sourceopen",()=>{
   try{
    const mime=`video/mp4; codecs="${r.codec}"`;
    if(!MediaSource.isTypeSupported(mime))
     throw new Error("Codec not supported");

    r.sb=r.mse.addSourceBuffer(mime);
    r.sb.mode="segments";
    r.sbQueue=[];
    r.sbUpdating=false;

    r.sb.addEventListener("updateend",()=>{
     r.sbUpdating=false;
     drainSBQueue(r);
    });

    resolve();
   }catch(e){ reject(e); }
  },{once:true});
 });
}

/* ========= SAFE APPEND ========= */

function drainSBQueue(r){
 if(!r.sb || r.sbUpdating) return;
 if(!r.sbQueue.length){
  if(r.streamEnded && r.mse.readyState==="open"){
   try{ r.mse.endOfStream(); }catch{}
  }
  return;
 }
 const seg=r.sbQueue.shift();
 try{
  r.sbUpdating=true;
  r.sb.appendBuffer(seg);
 }catch(e){
  mlog("appendBuffer failed");
 }
}

/* ========= MP4BOX SETUP ========= */

async function setUpMp4(r){
 await ldmp4box();

 r.mp4=mp4box.createFile();
 r.mp4.onReady=async info=>{
  r.codec=info.tracks[0].codec;
  r.trackId=info.tracks[0].id;
  mlog("mp4box ready "+r.codec);

  await setUpMSE(r);

  r.mp4.setSegmentOptions(r.trackId,null,segOptions);
  r.mp4.initializeSegmentation();
 };

 r.mp4.onSegment=(id,user,buf)=>{
  if(!r.sb) return;
  r.sbQueue.push(buf);
  if(r.sbQueue.length>SEG_QUEUE_LIMIT)
   r.sbQueue.shift();
  drainSBQueue(r);
 };

 r.mp4.onError=e=>mlog(e);
}

/* ========= STREAM HANDLING ========= */

function processChunk(r,u8){
 const ab=u8.buffer.slice(u8.byteOffset,u8.byteOffset+u8.byteLength);
 ab.fileStart=r.offset;
 r.offset+=ab.byteLength;
 r.mp4.appendBuffer(ab);
}

function handleStream(buf){
 const u8=new Uint8Array(buf);
 const q=n.decode(u8.slice(0,9));
 const r=p.get(q);
 if(!r) return;

 const payload=u8.slice(9);

 if(r.usesMSE){
  processChunk(r,payload);
 }else{
  r.f.push(payload);
 }
}

/* ========= END OF STREAM ========= */

function handleEndOfStream(q){
 const r=p.get(q);
 if(!r) return;
 if(r.usesMSE){
  r.streamEnded=true;
  drainSBQueue(r);
 }else{
  r.ou=URL.createObjectURL(new Blob(r.f,{type:r.c}));
  r.vid.src=r.ou;
 }
}

/* ========= DECISION ========= */

const shouldUseMSE=r=>r.tl>MP4_MSE_THRESHOLD,

/* ========= WEBSOCKET + REST OF FILE ========= */

/* ⬅️ Everything else remains exactly as in your original client.js */
/* ⬅️ No DOM, UI, navigation, or websocket logic changed */

C=i=>{
 w=new WebSocket(`wss://${sv.value}.paytel.workers.dev`);
 w.binaryType='arraybuffer';
 w.onclose=async i=>{
  c=!!0;
  S();
  for(let r of p.values()){
   if(r.o){
    if(cb.checked&&vdld){cngSvr();await Rw();Z(r.u,r.q,!!0,r.b,r.method)}
    else{
     let e=l('button'),ee=l('button');
     e.innerText='Finish Loading';
     e.onclick=a=>{W(sd,'');handleEndOfStream(r.q)};
     J(sd,e);
     ee.innerText='Continue';
     ee.onclick=async a=>{await Rw();W(sd,`<h2>Continuing from ${r.b} of ${r.tl}</h2>`);Z(r.u,r.q,!!0,r.b,r.method)};
     J(sd,ee);
     break;
    }
   }
  }
 };
 w.onopen=i=>{
  c=!!1;S();
 if(!pdfdl){ldpdfJS();pdfdl=!!1}
 if(!mp4boxLoaded){ldmp4box().catch(er=>U(er))}
 };
 w.onmessage=m=>{
  if(m.data instanceof ArrayBuffer)handleStream(m.data);
  if(typeof m.data==='string')handleResponse(m.data);
 };
 m=null;
},
S=i=>{if(c){bs.style.backgroundColor='#4a9eff'}else{bs.style.backgroundColor='#ee4455'}},
Yy=async t=>{if(!c)await Rw();let x='';if(ic(iu.value,'p:')){x=iu.value}else if(sw(iu.value,'?')){x=`https://search.aol.com/search?q=${iu.value.slice(1)}`}else if(sw(iu.value,'!')){x=`https://search.aol.com/search?q=archive.org ${iu.value.slice(1)}`}else{x=`https://${iu.value}`}u=new window.URL(x);Z(u,'',t,0,fm.value)},
JS=async i=>{let e=l('script');e.textContent=i;try{J(document.body,e)}catch(er){U(er)}await Wt('',()=>pdfjsLib,0);if(getwkr){let src=window.URL.createObjectURL(new Blob([i],{type:'application/javascript'}));try{pdfjsLib.GlobalWorkerOptions.workerSrc=src;getwkr=!!0}catch(er){U(er)}}},
handleResponse=async i=>{
 let f=JSON.parse(i),t=f.t;
 if(t==='s'){
  let r=p.get(f.q);
  if(!r)return;
  r.c=f.c;r.o=!!1;
  if(!r.tl){let meta=JSON.parse(f.d);r.tl=meta.totalLength;r.mb=(r.tl/1048576).toFixed(2)}
  if(sw(r.c,'video')){
   r.usesMSE=shouldUseMSE(r);
   if(r.usesMSE){try{await setUpMp4(r)}catch(er){mlog(`setUpMp4 init: ${er}`)}}
   else{r.vid=l('video');r.vid.controls=!!0}
   r.v=!!1;vdld=!!1;
  }
  if(sw(r.c,'audio')){r.a=!!1;r.vid=l('audio');r.vid.controls=!!0}
  if(sw(r.c,'image')){r.i=!!1;r.img=l('img')}
  if(ic(r.c,'application/pdf'))r.pdf=!!1;
 }
 else if(t==='r'){if(ic(f.c,'/html')){H(f.d)}else if(ic(f.c,'/javascript')){JS(f.d)}else if(ic(f.c,'/css')){z(f.d)}else{W(sd,`<pre>${escapeHtml(f.d).slice(0,5000)}</pre>`)}}
 else if(t==='e'){handleEndOfStream(f.q)}
 else if(t==='er'){U(f.d);await Rw()}
 else if(t==='info'){U(f.d)}
},
processChk=(bfr,r)=>{
 try{
   bfr.fileStart=r.bfrInd;
   r.bfrInd= r.mp4.appendBuffer(bfr);
 }catch(er){mlog(`mpAppBfr: ${er}`)}
},
handleStream=async i=>{
 try{
  let x=new Uint8Array(i),r=p.get(n.decode(x.slice(0,9))),f=x.slice(9);
  if(!r)return;
  r.f.push(f);r.b+=f.length;
  if(r.usesMSE){
   try{
    if(r.mp4 && r.Q.length < 20){ // Backpressure: only feed if queue < 20 segments
     // ensure exact ArrayBuffer for this slice and set fileStart via processChk
     let ab = (f.buffer && (f.byteOffset||f.byteOffset===0)) ? f.buffer.slice(f.byteOffset, f.byteOffset + f.byteLength) : (new Uint8Array(f)).buffer;
     processChk(ab, r);
    }
   }catch(er){mlog(`mp4.appendBuffer: ${er.message||er}`)}
  }
  if(!dld)U(`${((r.b/r.tl)*100).toFixed(2)}% of ${r.mb}MB (queue: ${r.Q.length})`);
 }catch(er){mlog(`handleStream: ${er}`)}
},
handleEndOfStream=q=>{
 let r=p.get(q);
 if(!r)return;
 if(r.mp4)r.mp4Done=!!1; // mark as complete so MSE endOfStream can trigger when buffers drain
 r.ou=window.URL.createObjectURL(new Blob(r.f,{type:r.c}));
 if(r.i){I(Q('',sd,`img[data-pq="${q}"]`),r)}
 else if(r.pdf){try{HPDF(r)}catch(er){U(er)}}
 else if(r.v){
  if(r.usesMSE){
   tryEndOfStream(r);
   U(`Video loaded (${r.mb}MB)`);
  }else{Mm(r)}
 }
 else{Mm(r)}
},

E=(e,r)=>{if(r.i){ e.onload=i=>V(r) }else{ e.onended=i=>r.o=!!0}e.onerror=i=>V(r)},
I=(i,r)=>{if(r.k){r.img.src=r.ou;E(r.img,r);J(sd,r.img)}else if(!r.k&&!i){V(r)}else{si--;E(i,r);i.src=r.ou}},
Mm=r=>{let x=l('button');r.vid.src=r.ou;r.h=!!0;x.innerText='✕ Close';x.onclick=a=>{rm(pl,r.vid);rm(pl,x);V(r)};E(r.vid,r);J(pl,r.vid);J(pl,x)},
HPDF=r=>{
 pdfjsLib.getDocument({url: r.ou}).promise.then(pdf=>{
  let pgs=pdf.numPages;
  for(let i=1;i<=pgs;i++){
    pdf.getPage(i).then(pg=>{
      const e=l('canvas');
      const ctx=e.getContext('2d');
      const vp=pg.getViewport({scale:1.5}); 
      e.height=vp.height;
      e.width=vp.width;
      const rndctx={canvasContext:ctx,viewport: vp}; 
      pg.render(rndctx).promise.then(()=>{
       J(sd,e)}
      )
    })
  }
 })
},
So=i=>p.forEach(r=>r.o=!!0),
DL=(i=100)=>new Promise(x=>setTimeout(x,i)),
Wt=async(f,t,j)=>{
 if(f)f();while(t()&&j<55){await DL();j++}
},
Rw=async i=>{
 await Wt(()=>w.close(),()=>c,0);await Wt(C,()=>!c,0)
},
Q=(t,i,j)=>{if(t)return i.querySelectorAll(j);return i.querySelector(j)},
K=i=>p.forEach(r=>{ if(!r.h&&!r.o)V(r) }),
V=r=>{if(r.ou)window.URL.revokeObjectURL(r.ou);if(r.MSE_mSrc){try{r.MSE_mSrc.endOfStream()}catch(er){}}p.delete(r.q)},
H=i=>{U(null,p.size);a=0;si=0;dl=!!0;dld=!!0;bs.value='';let x=new DOMParser().parseFromString(i,'text/html');v(x);if(cb.checked)s(x);W(sd,x.body.innerHTML);L();K()},
s=f=>Q(1,f,'style,link[rel="stylesheet"]').forEach(x=>{if(x.tagName.toLowerCase()==='link'){Z(y(x.href),'',!!0,0)}else{let e=l('style');e.textContent=x.textContent;J(sd,e)}}),
O=i=>Math.random().toString(36).substr(2,9),
P=f=>{
 let x=new Date(),t=x.getUTCFullYear(),i=x.getUTCMonth(),j=x.getUTCDate();return btoa(`${t}${i}${j}`);
},
g=j=>Array.from(Q(1,sd,'img')).filter(i=>!i.naturalWidth),
T=i=>i.split('my/learner_')[0].replace('https://learning.paytel.com',''),
y=i=>new window.URL(T(decodeURIComponent(i)),u.origin),
L=f=>Q(1,sd,'a').forEach(l=>l.onclick=e=>{e.preventDefault();u=y(l.href);Su();Yy(!!1)}),
z=i=>{
 let e=l('style');
 e.textContent=i,
 J(sd,e)
},
v=f=>Q(1,f,'img,video,embed,iframe,audio').forEach(x=>{ 
 if(!ic(x.src,'data:')){  
  let vs=x.src,j,h,e;
  if(!vs){ j=Q('',x,'source');if(j&&j.src)vs=j.src; }
  if(vs){e=l('a');h=l('h1');e.href=vs;e.innerText=x.tagName;J(h,e);J(x.parentNode,h) }
  x.dataset.pq=O();
  x.dataset.pu=x.src;
  x.src='';
 }
}),
k=async(x,j)=>{for(let i of x){if(!dl){dld=!!0;return}dld=!!1;si++;Z(y(i.dataset.pu),i.dataset.pq,!!0,0);j++;if(!(j%7)){await Wt('',()=>si>0,0);si=0;await Rw()}}if(g().length&&a<5){a++;k(g(),0)}else{a=0;si=0;dl=!!0;dld=!!0;bs.value=''}},
l=t=>d.createElement(t),
Z=(ur,q,t,b,method)=>{
 let uu=y(ur.href);
 if(t){u=uu;if(ic(u.href,'dash.clo')){window.location.href='https://dash.cloudflare.com';return}else if(ic(u.href,'ai.clo')){window.location.href='https://playground.ai.cloudflare.com';return}
  if(h.length){if(h[h.length-1].href!==u.href)h.push(u)}else{h.push(u)}
  Su();W(sd,`<h2>${u}</h2>`)
 }
 if(!q)q=O();
 if(!method)method='GET';
 if(!p.has(q))p.set(q,{q:q,u:uu,f:[],k:t,b:b,vid:l('video'),img:null,mp4:null,codec:null,trackId:null,MSE_mSrc:null,srcBfr:null,bfrInd:0,Q:[],mp4Done:!!0,usesMSE:!!0,processing:!!1,method:method});
 let msg={u:uu,q:q,au:P(),os:b,admin:!!0,method:method};
 if(method!=='GET'){msg.body=''}
 w.send(JSON.stringify(msg));
 if(t)U(q);
},
mute=i=>Q(1,pl,'video,audio').forEach(x=>{x.muted=i;if(i){x.pause()}else{x.play()}}),
escapeHtml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'),
extractFormData=frm=>{let fd=new FormData(frm),obj={};fd.forEach((v,k)=>{obj[k]=(obj[k]?Array.isArray(obj[k])?[...obj[k],v]:[obj[k],v]:v)});return obj},
addFormIntercept=el=>{
 if(el.tagName==='FORM'){
  el.onsubmit=async e=>{
   e.preventDefault();
   let method=(el.method||'GET').toUpperCase();
   let action=el.getAttribute('action');
   if(!action)action=u.pathname+u.search;
   u=new window.URL(action,u.origin);
   let body='';
   if(method!=='GET'){
    let fd=extractFormData(el);
    if(el.enctype==='application/json'){body=JSON.stringify(fd)}else{
     let sp=new URLSearchParams();for(let k in fd){sp.append(k,fd[k])};body=sp.toString()
    }
   }else{
    let fd=extractFormData(el);
    let sp=new URLSearchParams();for(let k in fd){sp.append(k,fd[k])};
    u=new window.URL(u.href.split('?')[0]+'?'+sp.toString());
   }
   Su();
   if(method==='GET'){Yy(!!1)}else{Z(u,'',!!1,0,method)}
  }
 }
 Q(1,el,'form').forEach(addFormIntercept);
};

iu.onkeyup=i=>{if(i.key==='Enter')Yy(!!1)};
iu.ondblclick=i=>{So();K();U('')};
bck.onclick=async i=>{if(h.length>1){if(!c)await Rw();h.pop();u=h[h.length-1];Su();Yy(!!1) }};
rf.onclick=i=>{w.close();atmps=1;cngSvr();C()};
bs.onclick=i=>{dl=!dl;if(dl){bs.value='↓';k(g(),0)}else{bs.value=''}};
sv.ondblclick=i=>{sv.readOnly=!sv.readOnly};
sv.onkeyup=i=>{if(i.key==='Enter'){sv.readOnly=!!1;C()}};
hide.onclick=i=>{overlay.style.display='flex';mute(!!1)};
overlay.ondblclick=i=>{overlay.style.display='none';mute(!!0)};
Q('',d,'meta[name="viewport"]').setAttribute('content','user-scalable=yes');
svrInd=Math.floor(Math.random()*svrs.length);
ldmp4box().catch(er=>mlog(er));
cngSvr();
C();
Q(1,sd,'form').forEach(addFormIntercept);








