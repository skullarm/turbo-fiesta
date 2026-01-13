let d=document,w,u,h=[],n=new TextDecoder(),p=new Map(),a=0,si=0,dl=!!0,dld=!!0,c=!!0,svrInd=0,atmps=4,vdld=!!0,mpbU='https://cdn.jsdelivr.net/npm/mp4box@latest/dist/mp4box.all.min.js',
ge=i=>d.getElementById(i),pdfdl=!!0,getwkr=!!0,mp4boxLoaded=!!0,mp4box;

const svrs=['osric','wit','offal','bilboes'];
// future server names const svrs=['bn','br','call','turbo','argos','kazak','phone','text','skip','trace','alice','harley','alpha','puck','theta','omega','mail','tango','sv1'];
const chunkSize=50 *1024*1024,segOptions={nbSamples:250};
d.body.innerHTML=
`
<div id='overlay' style='display:none;position:fixed;top:0;left:0;width:100%;height:100%;background-color:black;z-index:100000999'></div>
<div id='pl'></div>
  <div style='position:sticky;top:0;z-index:100000099'>
   <button id='bck'>BCK</button/>
   <button id='rf'>RF</button>
   <input id='iu' style='width:72%' placeholder='https://'> | <input id='sv' style='width:4%' readOnly placeholder='SVR'/> | <input id='cb' type='checkbox'/> | <input id='bs' type='button'/> | <button id='hide'>Hide</button> <span id='pg'/>
  </div>
 <div id='ct'></div>
 <div>${localStorage.getItem('A')}</div>
`;
let bck=ge('bck'),iu=ge('iu'),rf=ge('rf'),sv=ge('sv'),cb=ge('cb'),hide=ge('hide'),pg=ge('pg'),overlay=ge('overlay'),bs=ge('bs'),pl=ge('pl');
let sd=ct.attachShadow({mode:'open'});
let U=(i)=>pg.textContent=i,
ic=(e,i)=>e.includes(i),
sw=(e,i)=>e.startsWith(i),
rm=(e,i)=>e.removeChild(i),
J=(e,i)=>e.appendChild(i),
W=(e,i)=>e.innerHTML=i,
cngSvr=i=>{
 const svr=svrs[svrInd];
 sv.value=svr;
  DL();
 atmps--;
 if(atmps<=0){ svrInd=(svrInd+1)%svrs.length;atmps=4;}
},
Su=i=>{
 i='';
 if(ic(u.protocol,'p:'))i='http://';
 iu.value=i+u.hostname+u.pathname+u.search+u.hash;
 if(ic(iu.value,'RU=https://')){let val=iu.value;val=val.split('RU=https://')[1].split('/RK=')[0];iu.value=val};
},
ldpdfJS=i=>{
 Z(u=new window.URL('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js'),'',!!0,0);
 getwkr=!!1;
 Z(u=new window.URL('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js'),'',!!0,0);
},
setUpMp4=r=>{
 r.mp4=mp4box.createFile();
 r.mp4.onReady=async info=>{
  mlog(info);
  r.codec=info.tracks[0].codec;
  //setUpMSE(r);
 //await Wt(setUpMSE(r),()=>r.srcBfr===null,0);
  //mlog(`++++++${r.srcBfr}`);
  r.mp4.setSegmentOptions(info.tracks[0].id,'vid',segOptions);
  r.mp4.initializeSegmentation();
  // r.mp4.seek(0,true);
  r.mp4.start();
 await Wt( setUpMSE(r),()=>r.srcBfr===null,0);
mlog(`SrcBfr State: ${r.srcBfr}`);
};
 r.mp4.onSegment=(id,user,buffer,sampleNumber,last)=>{r.Q.push(buffer);
 mlog(`seg from ${id} for ${user} | ${sampleNumber} | IsLast:${last}`);
  processQ(r);
 // if(r.firstSeg){ r.firstSeg=!!0;r.srcBfr.appendBuffer(buffer)}
 // else{r.Q.push(buffer) }
 };
},
ldmp4box=i=>{
 const b=new Blob([localStorage.getItem('mp4box')],{type:'application/javascript'});
 const url=window.URL.createObjectURL(b);
 import(url).then(mod=>{mp4box=mod});
Wt('',()=>{typeof mp4boxmp4box==='undefined'},0);Loaded=!!1;
},
C=i=>{
 w=new WebSocket(`wss://${sv.value}.paytel.workers.dev`);
 w.binaryType='arraybuffer';
 w.onclose=async i=>{
  c=!!0;
  S();
  for(let r of p.values()){
   if(r.o){
    if(cb.checked && vdld){ cngSvr();await Rw();Z(r.u,r.q,!!0,r.b) }
    else{m
     let e=l('button'),ee=l('button');
     e.innerText='Load';
     e.onclick=a=>{W(sd,'');handleEndOfStream(r.q)};
     J(sd,e);
     ee.innerText='Continue';
     ee.onclick=async a=>{await Rw();W(sd,`<h2>Continuing from ${r.b} of ${r.tl}</h2>`);Z(r.u,r.q,!!0,r.b)};
     J(sd,ee);
     break;
    }
   }
  }
 };
 w.onopen=i=>{
  c=!!1;S();
 if(!pdfdl){ldpdfJS();pdfld=!!1  }
 if(!mp4boxLoaded){try{Wt(ldmp4box,()=>!mp4,0)}catch(er){U(er)}}
 };
 w.onmessage=m=>{
  if(m.data instanceof ArrayBuffer)handleStream(m.data);
  if(typeof m.data==='string')handleResponse(m.data);
 };
 m=null;
},
S=i=>{if(c){bs.style.backgroundColor='green'}else{bs.style.backgroundColor='red'}},
Yy=async t=>{if(!c)await Rw();
 let x='';
 if(ic(iu.value,'p:')){x=iu.value}else if(sw(iu.value,'?')){x=`https://search.aol.com/search?q=${iu.value.slice(1)}`}else if(sw(iu.value,'!')){x=`https://search.aol.com/search?q=archive.org ${iu.value.slice(1)}` }else{x=`https://${iu.value}`}u=new window.URL(x);Z(u,'',t,0);
},
JS=async i=>{
 let e=l('script');e.textContent=i;try{J(document.body,e);}catch(er){U(er)}
 await Wt('',()=>pdfjsLib,0);
 if(getwkr){ let src=window.URL.createObjectURL(new Blob([i],{type:'application/javascript'})); try{pdfjsLib.GlobalWorkerOptions.workerSrc=src;getwkr=!!0}catch(er){U(er)}}
},
handleResponse=async i=>{
 let f=JSON.parse(i),t=f.t;
 if(t==='s'){
  let r=p.get(f.q);
  r.c=f.c;
  r.o=!!1;
  if(!r.tl){r.tl=JSON.parse(f.d).totalLength;r.mb=(r.tl/1048576).toFixed(2)}
  if(sw(r.c,'v')){r.MSE_mSrc=new MediaSource();try{setUpMp4(r)}catch(er){mlog(er)};r.v=!!1;vdld=!!1;r.vid.onerror=e=>mlog(e);r.vid.oncanplay=e=>r.vid.play()}
  if(sw(r.c,'au')){r.a=!!1;r.vid=l('video')}
  if(sw(r.c,'i')){r.i=!!1;r.img=l('img')}
  if(ic(r.c,'application/pdf'))r.pdf=!!1;
 }
 else if(t==='r'){
  if(ic(f.c,'/html')){H(f.d)}
  else if(ic(f.c,'/javascript')){JS(f.d)}
  else if(ic(f.c,'/css')){z(f.d)}
  else{W(sd,`<pre>${f.d}</pre>`)}
}
 else if(t==='e'){handleEndOfStream(f.q)}
 else if(t==='er'){U(f.d);await Rw()}
 else if(t==='info'){U(f.d)}
},
processChk=(bfr,r)=>{
 try{
   bfr.fileStart=r.bfrInd;
   r.bfrInd= r.mp4.appendBuffer(bfr);
 //  r.mp4.flush()
 }catch(er){mlog(`mpAppBfr: ${er}`)}
},
handleStream=async i=>{
  let x=new Uint8Array(i),
  r=p.get(n.decode(x.slice(0,9))),
  f=x.slice(9);
  r.f.push(f);
 // let tmp=new Uint8Array(f);
// try{processChk(f.buffer,r);}catch(er){mlog(`prcChk: ${er}`);}
 
 r.b+=f.length;
 if(!dld)U(`${((r.b/r.tl)*100).toFixed(2)}% of ${r.mb} mb`)
},
handleEndOfStream=q=>{
 let r=p.get(q);
 r.ou= window.URL.createObjectURL(new Blob(r.f,{type:r.c}));
 //r.f=null;
 if(r.i){I(Q('',sd,`img[data-pq="${q}"]`),r)}else if(r.pdf){try{HPDF(r)}catch(er){ U(er)}}else{cb.checked=!!0;vdld=!!0;Mm(r)}
},
E=(e,r)=>{if(r.i){ e.onload=i=>V(r) }else{ e.onended=i=>r.o=!!0}e.onerror=i=>V(r)},
I=(i,r)=>{
// let e=l('img'); 
 if(r.k){r.img.src=r.ou;E(r.img,r);J(sd,r.img)  }else if(!r.k&&!i){V(r)  }else{si--;E(i,r);i.src=r.ou }
},
Mm=r=>{
 let x=l('button');r.vid.src=r.ou;
 r.vid.controls=!!1;
 r.h=!!1;
 x.innerText='X';
 x.onclick=a=>{rm(pl,r.vid);rm(pl,x);V(r)};
 E(r.vid,r);
 J(pl,r.vid);J(pl,x);
},
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
V=r=>{
 window.URL.revokeObjectURL(r.ou);p.delete(r.q);
},
H=i=>{
 U(null,p.size);
 a=0;si=0;dl=!!0;dld=!!0;bs.value='';
 let x=new DOMParser().parseFromString(i,'text/html');
 v(x);
 if(cb.checked)s(x);
 W(sd,x.body.innerHTML);
 L();K()
},
s=f=>Q(1,f,'style,link[rel="stylesheet"]').forEach(x=>{if(x.tagName.toLowerCase()==='link'){Z(y(x.href),'',!!0,0)}else{let e=l('style');e.textContent=x.textContent;J(sd,e) } }),
O=i=>Math.random().toString(36).substr(2,9),
P=f=>{
 let x=new Date(),t=x.getUTCFullYear(),i=x.getUTCMonth(),j=x.getUTCDate();return btoa(`${t}${i}${j}`);
},
g=j=>Array.from(Q(1,sd,'img')).filter(i=>!i.naturalWidth),
T=i=>i.split('my/learner_')[0].replace('https://learning.paytel.com',''),
y=i=>new window.URL(T(decodeURIComponent(i)),u.origin),
L=f=>Q(1,sd,'a').forEach(l=>l.onclick=e=>{ e.preventDefault();u=y(l.href);Su();Yy(!!1)}),
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
k=async(x,j)=>{
 for(let i of x){
  if(!dl){dld=!!0;return; }dld=!!1;si++;Z(y(i.dataset.pu),i.dataset.pq,!!0,0);j++;if(!(j%7)){await Wt('',()=>si>0,0);si=0;await Rw() }
 }
 if(g().length&&a<5){
 a++; k(g(),0)
 }else{
  a=0;si=0;dl=!!0;dld=!!0;bs.value=''
 }
},
l=t=>d.createElement(t),
Z=(ur,q,t,b)=>{
 let uu=y(ur.href);
 if(t){ 
  u=uu;
  if(ic(u.href,'dash.clo')){window.location.href='https://dash.cloudflare.com';return}
  else if(ic(u.href,'ai.clo')){window.location.href='https://playground.ai.cloudflare.com';return}

  if(h.length){
   if(h[h.length-1].href!==u.href)h.push(u)
  }else{ 
   h.push(u)
  }
  Su();
  W(sd,`<h2>${u}</h2>`)
 }
 if(!q)q=O();
 if(!p.has(q))p.set(q,{q:q,u:uu,f:[],k:t,b:b,vid:l('video'),img: null,mp4:null,codec:null,MSE_mSrc:null,srcBfr:null,bfrInd:0,firstSeg:true,Q:[],processing:false});
 w.send(JSON.stringify({u:uu,q,au:P(),os:b,admin:true}));
 if(t)
U(q);
},
mute=i=>Q(1,pl,'video,audio').forEach(x=>{x.muted=i;if(i){x.pause()}else{x.play()}});
iu.onkeyup=i=>{if(i.key==='Enter')Yy(!!1)};
iu.ondblclick=i=>{So();K();U('')};
bck.onclick=async i=>{if(h.length>1){if(!c)await Rw();h.pop();u=h[h.length-1];Su();Yy(!!1) }};
rf.onclick=i=>{w.close();atmps=1;cngSvr();C()};
bs.onclick=i=>{for(let r of p.values()){ U(r.srcBfr)} dl=!dl;if(dl){bs.value=`\u2193`;k(g(),0)}else{bs.value='' }};
sv.ondblclick=i=>{sv.readOnly=!sv.readOnly};
sv.onkeyup=i=>{if(i.key==='Enter'){ sv.readOnly=!!1;C()} };
hide.onclick=i=>{overlay.style.display='block';mute(!!1)};
overlay.ondblclick=i=>{overlay.style.display='none';mute(!!0)};
Q('',d,'meta[name="viewport"]').setAttribute('content','user-scalable=yes');
svrInd=Math.floor(Math.random()*svrs.length);
cngSvr();
C();
let setUpMSE=r=>{
//  r.MSE_mSrc=new MediaSource();
  r.vid.src=window.URL.createObjectURL(r.MSE_mSrc);
   r.vid.controls=!!1;
  J(pl,r.vid);
  r.MSE_mSrc.addEventListener('sourceopen',()=>{
  codec=`${r.c}; codecs="${r.codec}"`;
  try{
    mlog(`codec support for: ${codec}: ${MediaSource.isTypeSupported(codec)}`);
    r.srcBfr=r.MSE_mSrc.addSourceBuffer(codec);
    r.srcBfr.onerror=err=>mlog(err);
    r.srcBfr.onupdateend=e=>{r.isProcessing=!!0;processQ(r)};
   // if(!srcBfr.updating && mSrc.readyState==='open'){ mSrc.endOfStream()}
 //mlog(sb
 }catch(er){mlog(`addSrcBrfEr: ${er}`)}
});
},
mlog=er=>{let dd=new Date();let cur=localStorage.getItem('error')+`\n${dd} - ${JSON.stringify(er)}`; localStorage.setItem('error',cur)},
processQ=r=>{mlog(r.Q.length);
 if(r.Q.length && !r.isProcessing){ 
   r.isProcessing=!!1;
 //  let chunk=r.Q.shift();
//   r.srcBfr.appendBuffer(chunk);
//  mlog('appended');
 }
}








