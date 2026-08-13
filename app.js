const KEY="clientflow-local";let data=JSON.parse(localStorage.getItem(KEY)||'{"clients":[],"relances":[],"interventions":[],"invoices":[],"session":null}');let editing=null;
data.interventions=data.interventions||[];data.invoices=data.invoices||[];
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));const today=()=>new Date().toISOString().slice(0,10);const fmt=d=>d?new Date(d+"T12:00:00").toLocaleDateString("fr-FR"):"—";

function clientById(id){return data.clients.find(c=>c.id===id)}
function newIntervention(clientId){
 if(!data.clients.length)return alert("Ajoute d'abord un client.");
 modal(`<h2>🔧 Nouvelle intervention</h2>
 <label>Client<select id="iClient">${data.clients.map(c=>`<option value="${c.id}" ${c.id===clientId?"selected":""}>${esc(c.name)}</option>`)}</select></label>
 <label>Adresse d'intervention<input id="iAddress" placeholder="Adresse du dépannage"></label>
 <label>Problème / demande<textarea id="iProblem" placeholder="Ex. fuite, serrure bloquée, panne..."></textarea></label>
 <label>Date<input id="iDate" type="date" value="${today()}"></label>
 <label>Statut<select id="iStatus"><option>À faire</option><option>En cours</option><option>Terminé</option></select></label>
 <label>Prix (€)<input id="iPrice" type="number" step="0.01" value="0"></label>
 <label>Acompte (€)<input id="iDeposit" type="number" step="0.01" value="0"></label>
 <button class="primary" onclick="saveIntervention()">Enregistrer</button>`)
}
function saveIntervention(){
 data.interventions.push({id:crypto.randomUUID(),clientId:iClient.value,address:iAddress.value,problem:iProblem.value,date:iDate.value,status:iStatus.value,price:Number(iPrice.value||0),deposit:Number(iDeposit.value||0)});
 save();closeModal();render();
}
function newInvoice(clientId, interventionId){
 const c=clientById(clientId);
 const i=data.interventions.find(x=>x.id===interventionId);
 const number="SD-"+new Date().getFullYear()+"-"+String(data.invoices.length+1).padStart(4,"0");
 data.invoices.push({id:crypto.randomUUID(),number,clientId,interventionId,date:today(),total:i?.price||0,deposit:i?.deposit||0,status:"À payer"});
 save();closeModal();openInvoice(data.invoices[data.invoices.length-1].id);
}
function openInvoice(id){
 const f=data.invoices.find(x=>x.id===id),c=clientById(f.clientId),i=data.interventions.find(x=>x.id===f.interventionId);
 const due=Math.max(0,(f.total||0)-(f.deposit||0));
 modal(`<div id="invoicePrint" class="invoice">
 <div class="invoicehead"><div><h2>FACTURE</h2><b>Speed Dépannage</b><div class="muted">Dépannage & interventions</div></div><div><b>${esc(f.number)}</b><div class="muted">${fmt(f.date)}</div></div></div>
 <hr><p><b>Client</b><br>${esc(c?.name||"")}<br>${esc(c?.phone||"")}<br>${esc(c?.email||"")}</p>
 <p><b>Intervention</b><br>${esc(i?.problem||"Dépannage")}<br>${esc(i?.address||"")}</p>
 <div class="invoiceline"><span>Prestation</span><b>${Number(f.total||0).toFixed(2)} €</b></div>
 <div class="invoiceline"><span>Acompte</span><b>- ${Number(f.deposit||0).toFixed(2)} €</b></div>
 <div class="total"><span>Reste à payer</span><b>${due.toFixed(2)} €</b></div>
 </div>
 <div class="actions"><button class="primary" onclick="shareInvoice('${f.id}')">📤 Envoyer</button><button class="secondary" onclick="printInvoice('${f.id}')">🖨️ Imprimer / PDF</button></div>`)
}
function invoiceText(f){
 const c=clientById(f.clientId),i=data.interventions.find(x=>x.id===f.interventionId),due=Math.max(0,(f.total||0)-(f.deposit||0));
 return `Bonjour ${c?.name||""}, voici votre facture ${f.number} pour l'intervention de Speed Dépannage. Montant : ${Number(f.total||0).toFixed(2)} €. Acompte : ${Number(f.deposit||0).toFixed(2)} €. Reste à payer : ${due.toFixed(2)} €. Merci.`;
}
function shareInvoice(id){
 const f=data.invoices.find(x=>x.id===id),c=clientById(f.clientId),body=invoiceText(f);
 const choices=`<h2>📤 Envoyer la facture</h2><p>Choisis le moyen d'envoi. Le message contient le numéro et le montant de la facture.</p>
 <div class="actions">${c?.email?`<a class="primary actionlink" href="mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent("Facture "+f.number+" — Speed Dépannage")}&body=${encodeURIComponent(body)}">✉️ Email</a>`:""}${c?.phone?`<a class="primary actionlink" href="sms:${encodeURIComponent(c.phone)}?body=${encodeURIComponent(body)}">💬 SMS</a>`:""}${c?.phone?`<a class="primary actionlink" target="_blank" href="https://wa.me/${waPhone(c.phone)}?text=${encodeURIComponent(body)}">WhatsApp</a>`:""}</div>
 <p class="muted">Pour joindre le PDF lui-même, utilise « Imprimer / PDF », puis partage le PDF depuis l'app Fichiers ou le menu de partage de l'iPhone.</p>`;
 modal(choices);
}
function printInvoice(id){
 const f=data.invoices.find(x=>x.id===id),c=clientById(f.clientId),i=data.interventions.find(x=>x.id===f.interventionId),due=Math.max(0,(f.total||0)-(f.deposit||0));
 const w=window.open("","_blank"); if(!w)return;
 w.document.write(`<html><head><title>${f.number}</title><style>body{font-family:Arial;padding:35px;max-width:700px;margin:auto}.head{display:flex;justify-content:space-between}hr{border:0;border-top:1px solid #ddd}.line{display:flex;justify-content:space-between;padding:10px 0}.total{font-size:20px;font-weight:bold}</style></head><body><div class="head"><div><h1>FACTURE</h1><b>Speed Dépannage</b><p>Dépannage & interventions</p></div><div><b>${f.number}</b><p>${fmt(f.date)}</p></div></div><hr><p><b>Client</b><br>${esc(c?.name||"")}<br>${esc(c?.phone||"")}<br>${esc(c?.email||"")}</p><p><b>Intervention</b><br>${esc(i?.problem||"")}<br>${esc(i?.address||"")}</p><div class="line"><span>Prestation</span><b>${Number(f.total||0).toFixed(2)} €</b></div><div class="line"><span>Acompte</span><b>- ${Number(f.deposit||0).toFixed(2)} €</b></div><hr><div class="line total"><span>Reste à payer</span><b>${due.toFixed(2)} €</b></div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();
}

function init(){if(data.session){showApp()}else{document.getElementById("auth").classList.remove("hidden")}}
let pendingSignup=null,pendingCode=null;
function login(){
 const e=document.getElementById("email").value.trim().toLowerCase(),p=document.getElementById("password").value;
 const accounts=JSON.parse(localStorage.getItem("speed_accounts")||"{}");
 if(!e||!p)return authMsg.textContent="Renseigne ton email et ton mot de passe.";
 if(!accounts[e]){authMsg.textContent="Compte introuvable. Utilise « Créer mon compte ».":return;}
 if(accounts[e].password!==btoa(unescape(encodeURIComponent(p))))return authMsg.textContent="Email ou mot de passe incorrect.";
 data.session=e;save();showApp();
}
function signup(){
 const e=document.getElementById("email").value.trim().toLowerCase(),p=document.getElementById("password").value;
 if(!/^\\S+@\\S+\\.\\S+$/.test(e))return authMsg.textContent="Entre une adresse email valide.";
 if(p.length<8)return authMsg.textContent="Le mot de passe doit contenir au moins 8 caractères.";
 const accounts=JSON.parse(localStorage.getItem("speed_accounts")||"{}");
 if(accounts[e])return authMsg.textContent="Ce compte existe déjà.";
 pendingSignup={email:e,password:btoa(unescape(encodeURIComponent(p)))};
 pendingCode=String(Math.floor(100000+Math.random()*900000));
 // Demo only: show the code in the verification screen. Production must send it via a backend/email/SMS provider.
 modal(`<h2>Vérification de sécurité</h2><p>Un code de confirmation a été envoyé à <b>${esc(e)}</b>.</p><p class="muted">Mode test : ton code est <b>${pendingCode}</b>.</p><input id="verifyCode" inputmode="numeric" maxlength="6" placeholder="Code à 6 chiffres"><button class="primary" onclick="verifySignup()">Vérifier mon compte</button><button class="secondary" onclick="closeModal()">Annuler</button>`);
}
function verifySignup(){
 const code=document.getElementById("verifyCode").value.trim();
 if(code!==pendingCode)return alert("Code incorrect.");
 const accounts=JSON.parse(localStorage.getItem("speed_accounts")||"{}");
 accounts[pendingSignup.email]={password:pendingSignup.password,verified:true,createdAt:new Date().toISOString()};
 localStorage.setItem("speed_accounts",JSON.stringify(accounts));
 data.session=pendingSignup.email;save();pendingSignup=null;pendingCode=null;closeModal();showApp();
}
function resetPassword(){
 const e=document.getElementById("email").value.trim().toLowerCase();
 const accounts=JSON.parse(localStorage.getItem("speed_accounts")||"{}");
 if(!accounts[e])return authMsg.textContent="Aucun compte trouvé avec cet email.";
 pendingCode=String(Math.floor(100000+Math.random()*900000));
 modal(`<h2>Réinitialisation</h2><p>Code envoyé à <b>${esc(e)}</b>.</p><p class="muted">Mode test : ton code est <b>${pendingCode}</b>.</p><input id="resetCode" inputmode="numeric" maxlength="6" placeholder="Code à 6 chiffres"><input id="newPassword" type="password" placeholder="Nouveau mot de passe (8 caractères minimum)"><button class="primary" onclick="finishReset('${e}')">Changer le mot de passe</button>`);
}
function finishReset(e){
 if(document.getElementById("resetCode").value!==pendingCode)return alert("Code incorrect.");
 const p=document.getElementById("newPassword").value;if(p.length<8)return alert("8 caractères minimum.");
 const accounts=JSON.parse(localStorage.getItem("speed_accounts")||"{}");accounts[e].password=btoa(unescape(encodeURIComponent(p)));localStorage.setItem("speed_accounts",JSON.stringify(accounts));closeModal();authMsg.textContent="Mot de passe modifié. Tu peux te connecter.";
}
function showApp(){auth.classList.add("hidden");app.classList.remove("hidden");nav.classList.remove("hidden");logout.classList.remove("hidden");render()}
logout.onclick=()=>{data.session=null;save();location.reload()}
function page(id){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active");render()}
function render(){if(typeof nClients!=="undefined")nClients.textContent=data.clients.length;const due=data.relances.filter(r=>!r.done&&r.date<=today());nDue.textContent=due.length;nLate.textContent=due.filter(r=>r.date<today()).length;today.innerHTML=due.length?due.map(relanceHTML).join(""):"<p class='muted'>Rien à faire aujourd'hui 🎉</p>";renderClients();renderRelances();if(typeof renderInterventions==="function")renderInterventions();if(typeof renderInvoices==="function")renderInvoices()}
function renderClients(){const q=(search.value||"").toLowerCase();const a=data.clients.filter(c=>(c.name+" "+c.phone+" "+c.email).toLowerCase().includes(q));clientsList.innerHTML=a.length?a.map(c=>`<div class="client"><div class="clienttop"><div><b>${esc(c.name)}</b><div class="muted">${esc(c.phone||"")} ${c.email?"· "+esc(c.email):""}</div><span class="badge">${esc(c.status||"Prospect")}</span></div></div><div class="actions">${c.phone?`<a class="secondary actionlink" href="tel:${esc(c.phone)}">📞 Appeler</a>`:""}${c.phone?`<a class="secondary actionlink" href="sms:${esc(c.phone)}">💬 SMS</a>`:""}${c.phone?`<a class="secondary actionlink" target="_blank" href="https://wa.me/${waPhone(c.phone)}">WhatsApp</a>`:""}${c.email?`<a class="secondary actionlink" href="mailto:${esc(c.email)}">✉️ Email</a>`:""}<button class="secondary" onclick="editClient('${c.id}')">Modifier</button><button class="primary" onclick="newRelance('${c.id}')">Relancer</button></div></div>`).join(""):"<p class='muted'>Aucun client.</p>"}
function relanceHTML(r){const c=data.clients.find(x=>x.id===r.clientId);return `<div class="relance"><div><b>${esc(c?.name||"Client")}</b><div class="muted">${fmt(r.date)} · ${esc(r.channel)}</div><div>${esc(r.note||"")}</div></div><div class="actions">${r.done?"<span class='badge'>Terminée</span>":`<button class="secondary" onclick="send('${r.id}')">Envoyer</button><button class="primary" onclick="done('${r.id}')">✓ Fait</button>`}</div></div>`}

function renderInterventions(){
 const el=document.getElementById("interventionsList"); if(!el)return;
 el.innerHTML=data.interventions.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(i=>{const c=clientById(i.clientId);return `<div class="relance"><div><b>🔧 ${esc(c?.name||"Client")}</b><div class="muted">${fmt(i.date)} · ${esc(i.status)}</div><div>${esc(i.problem||"")}</div><div class="muted">${esc(i.address||"")} · ${Number(i.price||0).toFixed(2)} €</div></div><div class="actions"><button class="primary" onclick="newInvoice('${i.clientId}','${i.id}')">🧾 Facture</button></div></div>`}).join("")||"<p class='muted'>Aucune intervention.</p>";
}
function renderInvoices(){
 const el=document.getElementById("invoicesList"); if(!el)return;
 el.innerHTML=data.invoices.slice().reverse().map(f=>{const c=clientById(f.clientId);return `<div class="relance"><div><b>🧾 ${esc(f.number)}</b><div class="muted">${esc(c?.name||"Client")} · ${fmt(f.date)}</div><div>${Number(f.total||0).toFixed(2)} € · ${esc(f.status)}</div></div><div class="actions"><button class="primary" onclick="openInvoice('${f.id}')">Voir / Envoyer</button></div></div>`}).join("")||"<p class='muted'>Aucune facture.</p>";
}

function renderRelances(){relancesList.innerHTML=data.relances.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(relanceHTML).join("")||"<p class='muted'>Aucune relance.</p>"}
function modal(x){modalBody.innerHTML=x;document.getElementById("modal").classList.remove("hidden")}function closeModal(){document.getElementById("modal").classList.add("hidden")}
function newClient(){editing=null;modal(`<h2>Nouveau client</h2><label>Nom*<input id="cName"></label><label>Téléphone<input id="cPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="06 12 34 56 78"></label><label>Email<input id="cEmail"></label><label>Entreprise<input id="cCompany"></label><label>Statut<select id="cStatus"><option>Prospect</option><option>Client</option><option>Perdu</option></select></label><label>Notes<textarea id="cNotes"></textarea></label><button class="primary" onclick="saveClient()">Enregistrer</button>`)}
function editClient(id){editing=data.clients.find(c=>c.id===id);modal(`<h2>Modifier client</h2><label>Nom*<input id="cName" value="${esc(editing.name)}"></label><label>Téléphone<input id="cPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="06 12 34 56 78" value="${esc(editing.phone)}"></label><label>Email<input id="cEmail" value="${esc(editing.email)}"></label><label>Entreprise<input id="cCompany" value="${esc(editing.company)}"></label><label>Statut<select id="cStatus"><option ${editing.status==="Prospect"?"selected":""}>Prospect</option><option ${editing.status==="Client"?"selected":""}>Client</option><option ${editing.status==="Perdu"?"selected":""}>Perdu</option></select></label><label>Notes<textarea id="cNotes">${esc(editing.notes)}</textarea></label><button class="primary" onclick="saveClient()">Enregistrer</button>`)}
function saveClient(){const name=cName.value.trim();if(!name)return;const x={id:editing?.id||crypto.randomUUID(),name,phone:cPhone.value,email:cEmail.value,company:cCompany.value,status:cStatus.value,notes:cNotes.value};if(editing)data.clients=data.clients.map(c=>c.id===x.id?x:c);else data.clients.push(x);save();closeModal();render()}
function newRelance(clientId){if(!data.clients.length)return alert("Ajoute d'abord un client.");modal(`<h2>Planifier une relance</h2><label>Client<select id="rClient">${data.clients.map(c=>`<option value="${c.id}" ${c.id===clientId?"selected":""}>${esc(c.name)}</option>`)}</select></label><label>Date<input id="rDate" type="date" value="${today()}"></label><label>Canal<select id="rChannel"><option>SMS</option><option>WhatsApp</option><option>Email</option></select></label><label>Message / note<textarea id="rNote">Bonjour {nom}, je reviens vers vous concernant notre échange. Je reste disponible si besoin.</textarea></label><button class="primary" onclick="saveRelance()">Planifier</button>`)}
function saveRelance(){data.relances.push({id:crypto.randomUUID(),clientId:rClient.value,date:rDate.value,channel:rChannel.value,note:rNote.value,done:false});save();closeModal();render()}
function done(id){const r=data.relances.find(x=>x.id===id);r.done=true;save();render()}
function waPhone(p){let x=String(p).replace(/\D/g,"");if(x.startsWith("0"))x="33"+x.slice(1);return x}
function send(id){const r=data.relances.find(x=>x.id===id),c=data.clients.find(x=>x.id===r.clientId);const body=r.note.replaceAll("{nom}",c.name);if(r.channel==="Email"&&c.email)location.href=`mailto:${c.email}?subject=${encodeURIComponent("Relance Speed Dépannage")}&body=${encodeURIComponent(body)}`;else if(r.channel==="WhatsApp"&&c.phone)location.href=`https://wa.me/${waPhone(c.phone)}?text=${encodeURIComponent(body)}`;else if(c.phone)location.href=`sms:${c.phone}?body=${encodeURIComponent(body)}`;else alert("Ajoute un téléphone ou un email à ce client.")}
function exportData(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download="clientflow-sauvegarde.json";a.click()}
init();