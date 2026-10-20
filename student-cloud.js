import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { getFirestore, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';
const cfg = window.IPQUEST_FIREBASE_CONFIG;
const badge = document.getElementById('cloudState');
const status = txt => { if(badge) badge.textContent = txt; };
if (!cfg || Object.values(cfg).some(x => !x || String(x).startsWith('REPLACE_'))) {
  status('⚠️ Firebase бапталмаған · тек жергілікті режим');
} else {
  try {
    const app = initializeApp(cfg), auth = getAuth(app), db = getFirestore(app);
    let currentUser = null, busy = false, queued = false;
    const sync = async () => {
      if (!currentUser) { queued = true; return; }
      if (busy) { queued = true; return; }
      let state;
      try { state = JSON.parse(localStorage.getItem('ipquest-v1') || '{}'); } catch { return; }
      const name = String(state.name || '').trim().slice(0,60);
      if (!name) {status('✍️ Алдымен аты-жөніңізді сақтаңыз');return;}
      const best = Array.isArray(state.best) && state.best.length === 6 ? state.best.map((x,i)=>Math.max(0,Math.min([10,5,5,5,5,10][i],Number(x)||0))) : [0,0,0,0,0,0];
      busy = true;
      try {
        await setDoc(doc(db, 'students', currentUser.uid), { name, best, total: best.reduce((a,b)=>a+b,0), completed:best.filter((n,i)=>n===[10,5,5,5,5,10][i]).length, updatedAt: serverTimestamp() });
        status('☁️ Нәтиже Firebase-ке сақталды ✓');
      } catch (err) { status('⚠️ Firebase: '+(err.code||err.message)); console.error(err); }
      finally {busy = false; if (queued){ queued=false; void sync(); }}
    };
    window.ipQuestCloud = {sync};
    onAuthStateChanged(auth, async user=> {
      if (user) { currentUser=user; status('☁️ Firebase қосылды ✓');await sync(); }
      else {currentUser=null;try { await signInAnonymously(auth); } catch(e){status('⚠️ Auth: '+(e.code||e.message));}}
    });
  } catch(e) {status('⚠️ Firebase қатесі');console.error(e);}
}
