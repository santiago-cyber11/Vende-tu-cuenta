import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/*
 * Pega aquí la configuración de Firebase de TU proyecto.
 * Nunca pongas claves privadas de servidor, secretos de OAuth ni credenciales de pasarela en el navegador.
 */

    const firebaseConfig = {
    apiKey: "AIzaSyC4s8YRp6M-iyBbbSuec9bBp4dITcy2BYc",
    authDomain: "vende-tu-cuenta.firebaseapp.com",
    projectId: "vende-tu-cuenta",
    storageBucket: "vende-tu-cuenta.firebasestorage.app",
    messagingSenderId: "486652142254",
    appId: "1:486652142254:web:ec4d50432877c7b5b3433f",
    measurementId: "G-23XXRJ8RFY"
    };
    let configured = !!firebaseConfig.apiKey;
let app, auth, db;
let currentUser = null;
  
async function loadMyProfile(){
 if(!currentUser){$('myProfileStatus').textContent='Inicia sesión con Google para administrar tu perfil.';$('myListings').textContent='Inicia sesión para ver tus publicaciones.';$('mySales').textContent='Inicia sesión para ver tu historial.';return;}
 try{
  const snap=await getDoc(doc(db,'users',currentUser.uid));
  const p=snap.exists()?snap.data():{};
  $('profileAlias').value=p.alias||currentUser.displayName||'';
  $('profileBio').value=p.bio||'';
  $('myProfileStatus').textContent='Sesión iniciada como '+(currentUser.email||currentUser.displayName||'usuario')+'.';
  const lq=query(collection(db,'listings'),where('ownerId','==',currentUser.uid));
  const ls=await getDocs(lq);
  $('myListings').innerHTML=ls.empty?'Todavía no tienes publicaciones.':Array.from(ls.docs).map(d=>{const x=d.data();return `<div class="calc-result"><strong>${safeText(x.title)}</strong><div>${fmt(x.price)} · ${safeText(x.status||'activa')}</div></div>`}).join('');
  const sq=query(collection(db,'purchases'),where('sellerId','==',currentUser.uid),orderBy('createdAt','desc'),limit(30));
  const ss=await getDocs(sq);
  $('mySales').innerHTML=ss.empty?'No hay ventas registradas todavía.':Array.from(ss.docs).map(d=>{const x=d.data();return `<div class="calc-result">${safeText(x.listingTitle||'Venta')} · ${fmt(x.amount)} · ${safeText(x.status||'procesando')}</div>`}).join('');
 }catch(e){$('myProfileStatus').textContent='No se pudo cargar el perfil. Revisa las reglas de Firestore y la configuración.';}
}
async function loadReviews(sellerId){
 activeSellerId=sellerId;
 if(!$('sellerReviews'))return;
 try{
  const q=query(collection(db,'reviews'),where('sellerId','==',sellerId),orderBy('createdAt','desc'),limit(20));
  const snaps=await getDocs(q);
  $('sellerReviews').innerHTML=snaps.empty?'Aún no hay valoraciones verificadas.':snaps.docs.map(d=>{const r=d.data();return `<div class="calc-result"><strong>${'★'.repeat(Math.max(1,Math.min(5,Number(r.stars)||1)))}</strong><p>${safeText(r.comment||'Sin comentario')}</p><small>${safeText(r.buyerAlias||'Comprador')} · compra verificada</small></div>`}).join('');
 }catch(e){$('sellerReviews').textContent='Las valoraciones estarán disponibles al configurar Firestore.';}
}
async function saveListingToCloud(data){
 if(!currentUser) throw new Error('Inicia sesión con Google antes de publicar.');
 const saved=await addDoc(collection(db,'listings'),{...data,ownerId:currentUser.uid,status:'active',createdAt:serverTimestamp()}); return saved.id;
}
window.vendeSaveListingToCloud=saveListingToCloud;
window.vendeCurrentUserId=()=>currentUser?.uid||null;
window.vendeLoadReviews=loadReviews;
document.addEventListener('vende-google-login-request',async()=>{
 if(!configured){status('Falta configurar Firebase. Abre CONFIGURACION_FIREBASE.txt y completa firebaseConfig.');toast('Configura Firebase primero');return;}
 try{await signInWithPopup(auth,new GoogleAuthProvider());$('loginModal')?.classList.remove('open');toast('Sesión iniciada con Google');}
 catch(e){status('No se pudo iniciar sesión: '+(e.code||'error')+'. Comprueba que Google esté activado en Firebase Authentication.');}
});
document.addEventListener('DOMContentLoaded',()=>{
 $('openMyProfile')?.addEventListener('click',openMyProfile);
 $('closeMyProfile')?.addEventListener('click',()=>$('myProfileModal')?.classList.remove('open'));
 $('myProfileModal')?.addEventListener('click',e=>{if(e.target===$('myProfileModal'))$('myProfileModal').classList.remove('open');});
 $('profileForm')?.addEventListener('submit',async e=>{
  e.preventDefault();if(!currentUser){toast('Inicia sesión primero');return;}
  try{await setDoc(doc(db,'users',currentUser.uid),{uid:currentUser.uid,email:currentUser.email||'',displayName:currentUser.displayName||'',photoURL:currentUser.photoURL||'',alias:safeText($('profileAlias').value)||'Vendedor',bio:safeText($('profileBio').value),updatedAt:serverTimestamp()},{merge:true});toast('Perfil guardado en la nube');}
  catch(err){$('myProfileStatus').textContent='No se pudo guardar el perfil. Revisa las reglas de Firestore.';}
 });
 $('signOutBtn')?.addEventListener('click',async()=>{if(auth)await signOut(auth);$('myProfileModal')?.classList.remove('open');toast('Sesión cerrada');});
 $('reviewForm')?.addEventListener('submit',async e=>{
  e.preventDefault();if(!currentUser){$('reviewStatus').textContent='Inicia sesión para valorar.';return;}
  if(!activeSellerId){$('reviewStatus').textContent='No se pudo identificar al vendedor.';return;}
  try{
   const buys=await getDocs(query(collection(db,'purchases'),where('buyerId','==',currentUser.uid),where('sellerId','==',activeSellerId),where('status','==','completed'),limit(1)));
   if(buys.empty){$('reviewStatus').textContent='Solo puedes valorar después de una compra completada y verificada.';return;}
   await addDoc(collection(db,'reviews'),{sellerId:activeSellerId,buyerId:currentUser.uid,buyerAlias:currentUser.displayName||'Comprador',stars:Number($('reviewStars').value),comment:safeText($('reviewText').value),purchaseId:buys.docs[0].id,createdAt:serverTimestamp()});
   $('reviewStatus').textContent='Valoración enviada.';$('reviewText').value='';await loadReviews(activeSellerId);
  }catch(err){$('reviewStatus').textContent='No se pudo enviar. Comprueba la configuración de Firestore.';}
 });
 if(!configured){status('Modo de preparación: configura Firebase para activar inicio de sesión, perfiles compartidos, publicaciones y valoraciones.');return;}
 try{
  const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
  onAuthStateChanged(auth,async user=>{currentUser=user;if(user){status('Sesión iniciada como '+(user.displayName||user.email));}else{status('No has iniciado sesión.');}if($('myProfileModal')?.classList.contains('open'))loadMyProfile();});
 }catch(e){status('Error en la configuración de Firebase. Revisa CONFIGURACION_FIREBASE.txt.');}
});
