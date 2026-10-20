import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js';
import {getAuth, onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import {getFirestore, collection, onSnapshot} from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';
const $ = id => document.getElementById(id), cfg=window.IPQUEST_FIREBASE_CONFIG;
let records=[],unsubscribe=null;
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!cfg||Object.values(cfg).some(x=>!x||String(x).startsWith('REPLACE_'))) {
 $('systemStatus').textContent='⚠️ firebase-config.js файлын толтырыңыз.';
 $('login').querySelector('button').disabled=true;
} else {
 const app=initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
 $('login').addEventListener('submit',async e=>{e.preventDefault();$('loginStatus').textContent='Тексерілуде...';try{await signInWithEmailAndPassword(auth,$('email').value,$('password').value);$('password').value='';$('loginStatus').textContent='';}catch(err){$('loginStatus').textContent='Кіру қатесі: '+(err.code||err.message)}});
 $('logout').onclick=()=>signOut(auth);
 onAuthStateChanged(auth,u=>{if(unsubscribe){unsubscribe();unsubscribe=null} $('dashboard').hidden=!u;$('authcard').hidden=!!u;$('logout').hidden=!u;if(!u)return;
  unsubscribe=onSnapshot(collection(db,'students'),s=>{records=s.docs.map(x=>({id:x.id,...x.data()}));render();$('systemStatus').textContent='☁️ Нақты уақыттағы байланыс қосылған';},err=>{$('systemStatus').textContent='⚠️ Оқу рұқсаты жоқ немесе қате: '+(err.code||err.message)+'. Мұғалім UID мен Firestore rules тексеріңіз.'});
 });
}
function filtered(){const q=$('filter').value.trim().toLocaleLowerCase();return records.filter(r=>String(r.name||'').toLocaleLowerCase().includes(q)).sort((a,b)=>Number(b.total||0)-Number(a.total||0)||String(a.name).localeCompare(String(b.name)))}
function render(){const a=filtered();$('count').textContent=records.length;$('avg').textContent=records.length?(records.reduce((s,r)=>s+(Number(r.total)||0),0)/records.length).toFixed(1):'0';$('completed').textContent=records.filter(r=>r.completed===6).length;
 $('rows').innerHTML=a.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td>${[0,1,2,3,4,5].map(j=>`<td>${Number(r.best?.[j]||0)}</td>`).join('')}<td><b>${Number(r.total||0)}/40</b></td><td>${Number(r.completed||0)}/6</td><td>${r.updatedAt?.toDate?.()?.toLocaleString('kk-KZ')||'—'}</td></tr>`).join('')||'<tr><td colspan="11">Әзірге оқушы нәтижелері жоқ.</td></tr>';
 $('updated').textContent=`Көрсетілген оқушылар: ${a.length}. Бір оқушы бір браузерде ең үздік нәтижесін сақтайды.`;
}
$('filter').oninput=render;
$('csv').onclick=()=>{let r=[['Аты-жөні','Деңгей 1','Деңгей 2','Деңгей 3','Деңгей 4','Деңгей 5','Деңгей 6','Ұпай','Аяқталған деңгей']];filtered().forEach(x=>r.push([x.name,...(x.best||[0,0,0,0,0,0]),x.total,x.completed]));const csv='\uFEFF'+r.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(';')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ip-quest-results.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
const studentUrl=new URL('index.html',location.href).href;$('url').textContent=studentUrl;$('url').href=studentUrl;$('qr').src='https://api.qrserver.com/v1/create-qr-code/?size=320x320&data='+encodeURIComponent(studentUrl);$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(studentUrl);$('copy').textContent='Көшірілді ✓'}catch{$('copy').textContent='Жоғарыдағы сілтемені көшіріңіз'}};
