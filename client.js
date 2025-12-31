let d=document,w,u,h=[],n=new TextDecoder,p=new Map(),a=0,si=0,dl=!!0,dld=!!0,c=!!0,svrInd=0,atmps=4,vdld=!!0,
ge=i=>d.getElementById(i),pdfdl=!!0,getwkr=!!0;
const svrs=['bn','br','call','turbo','argos','kazak','phone','text','skip','trace','alice','harley','alpha','puck','theta','omega','mail','tango','sv1'];
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
`;
let bck=ge('bck'),iu=ge('iu'),rf=ge('rf'),sv=ge('sv'),cb=ge('cb'),hide=ge('hide'),pg=ge('pg'),overlay=ge('overlay'),bs=ge('bs');
let sd=ct.attachShadow({mode:'open'});
let U=i=>pg.textContent=i,
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
 if(atmps<=0){ svrInd=(svrInd 1)%svrs.length;atmps=4;}
},
Su=i=>{
 i='';
 if(ic(u.protocol,'p:'))i='http://';
 iu.value=i u.hostname u.pathname u.search u.hash;
 if(ic(iu.value,'RU=https://')){let val=iu.value;val=val.split('RU=https://')[1].split('/RK=')[0];iu.value=val};
},
ldpdfJS=i=>{
 Z(u=new window.URL('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js'),'',!!0,0);
 getwkr=!!1;
 Z(u=new window.URL('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js'),'',!!0,0);
},
C=i=>{
 w=new WebSocket(`wss://${sv.value}.paytel.workers.dev`);
 w.binaryType='arraybuffer';
 w.onclose=async i=>{
  c=!!0;
  S();
  for(let r of p.values()){
   if(r.o){
    if(cb.checked){
        await Rw();
        cngSvr();
        Z(r.u,r.q,!!0,r.b);
    }
    else{

    }
   }
} 
}}