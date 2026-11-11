(function () {
  'use strict';
  var VERSION = '1';
  var $app = document.getElementById('app');
  var mem = {};
  function lire(k, d) { try { var v = localStorage.getItem(k); return v == null ? (k in mem ? mem[k] : d) : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : d; } }
  function ecrire(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* mémoire seulement */ } }
  var saisies = lire('rt_saisies', []);
  var troupeau = lire('rt_troupeau', null);
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function aujourdhui() { return iso(new Date()); }
  function dateFr(s) { return s ? s.split('-').reverse().join('/') : ''; }
  function jourLong(s) { var d = new Date(s + 'T12:00:00'); return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); }
  function nb(s) { s = String(s == null ? '' : s).trim().replace(',', '.'); var n = Number(s); return s === '' || !isFinite(n) ? null : n; }
  function fr(n, d) { return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function uid() { try { return crypto.randomUUID(); } catch (e) { return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); } }
  function sauver() { ecrire('rt_saisies', saisies); }
  function purge() {
    var lim = Date.now() - 30 * 86400000;
    saisies = saisies.filter(function (s) { return !(s.sent && s.sentAt && s.sentAt < lim); });
    sauver();
  }
  purge();
  function aEnvoyer() { return saisies.filter(function (s) { return !s.sent; }); }
  function toast(m) {
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  var ICON = {
    goutte: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3Z"/></svg>',
    pulse: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-7 4 14 3-7h4"/></svg>',
    liste: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/></svg>',
    fiole: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/></svg>',
    pese: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14l1.5 13h-17L5 7Z"/><circle cx="12" cy="4.5" r="1.8"/><path d="m12 15 2.2-3"/></svg>',
    fleche: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    retour: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>'
  };
  var vue = 'accueil';
  var L = { litres: '', jours: 1, date: aujourdhui() };
  var P = { num: '', sel: null, kg: '' };

  function go(v) { vue = v; if (v === 'lait') L = { litres: '', jours: 1, date: aujourdhui() }; if (v === 'pesee') P = { num: '', sel: null, kg: '' }; render(); window.scrollTo(0, 0); }

  function chevrerie() {
    var n = aEnvoyer().length;
    var chip = n ? '<span class="chip warn">' + n + ' à envoyer</span>' : '<span class="chip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Tout est envoyé</span>';
    var info = troupeau ? 'Troupeau chargé le ' + esc(dateFr((troupeau.genere || '').slice(0, 10))) + ' (' + troupeau.chevres.length + ' animaux).' : '<strong>Troupeau non chargé.</strong> Chargez le fichier « troupeau_rationneur.json » pour retrouver les chèvres par leur numéro.';
    return '<button class="back" data-go="accueil">' + ICON.retour + 'Piloterie</button><div class="top"><div><h1>Chèvrerie</h1></div>' + chip + '</div>' +
      '<div class="sub" style="margin-top:6px">' + esc(jourLong(aujourdhui())) + '</div>' +
      '<div class="tiles">' +
      '<button class="tile" data-go="lait">' + ICON.goutte + '<div style="flex:1"><b>Lait du tank</b><span>Relevé du matin : veille au soir + matin</span></div>' + ICON.fleche + '</button>' +
      '<button class="tile light" disabled>' + ICON.pulse + '<div style="flex:1"><b>Qualité du lait</b><span>Bientôt</span></div></button>' +
      '<button class="tile" disabled>' + ICON.liste + '<div style="flex:1"><b>Contrôle individuel</b><span>Bientôt</span></div></button>' +
      '<button class="tile light" disabled>' + ICON.fiole + '<div style="flex:1"><b>Résultats du labo (TB / TP)</b><span>Bientôt</span></div></button>' +
      '<button class="tile pink" data-go="pesee">' + ICON.pese + '<div style="flex:1"><b>Pesée</b><span>Cabris et chevrettes, un par un</span></div>' + ICON.fleche + '</button>' +
      '</div>' +
      '<button class="btn" id="envoyer"' + (n ? '' : ' style="background:var(--card);color:var(--ink);border:1.5px solid var(--border)"') + '>Envoyer les résultats' + (n ? ' (' + n + ')' : '') + '</button>' +
      '<div class="foot">' + info + '<br><label style="display:inline-block;margin-top:8px;color:var(--blue-ink);font-weight:600;text-decoration:underline;cursor:pointer">Charger le troupeau<input id="fichier" type="file" accept=".json,application/json" hidden></label>' +
      ' · <a href="#" id="renvoyer" style="color:var(--blue-ink);font-weight:600">Renvoyer tout (30 jours)</a></div>';
  }

  function accueil() {
    var n = aEnvoyer().length;
    var chip = n ? '<span class="chip warn">' + n + ' à envoyer</span>' : '<span class="chip">Tout est envoyé</span>';
    return '<div class="top"><div><div class="sub">Ferme de la Piloterie</div><h1>Piloterie</h1></div>' + chip + '</div>' +
      '<div class="sub" style="margin-top:6px">' + esc(jourLong(aujourdhui())) + '</div>' +
      '<div class="tiles"><button class="tile" data-go="chevrerie" style="min-height:110px">' + ICON.goutte + '<div style="flex:1"><b style="font-size:24px">Chèvrerie</b><span>Lait du tank, pesées, contrôles</span></div>' + ICON.fleche + '</button>' +
      '<button class="tile light" disabled style="min-height:110px">' + ICON.pulse + '<div style="flex:1"><b style="font-size:24px">Fromagerie</b><span>Bientôt</span></div></button></div>' +
      '<button class="btn" id="envoyer"' + (n ? '' : ' style="background:var(--card);color:var(--ink);border:1.5px solid var(--border)"') + '>Envoyer les résultats' + (n ? ' (' + n + ')' : '') + '</button>';
  }

  function lait() {
    var passes = saisies.filter(function (s) { return s.type === 'tank'; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var hist = passes.slice(0, 4).map(function (s) {
      return '<div><span>' + esc(dateFr(s.date)) + (s.jours > 1 ? ' · ' + s.jours + ' jours' : '') + '</span><span><strong>' + fr(s.litres, 1) + ' L</strong> <span class="tag' + (s.sent ? ' ok' : '') + '">' + (s.sent ? 'envoyé' : 'à envoyer') + '</span>' + (s.sent ? '' : ' <button class="x" data-del="' + s.id + '" aria-label="Supprimer">✕</button>') + '</span></div>';
    });
    if (troupeau && troupeau.tank) troupeau.tank.slice(0, Math.max(0, 4 - hist.length)).forEach(function (t) { hist.push('<div><span>' + esc(dateFr(t.date)) + '</span><strong>' + fr(t.litres, 1) + ' L</strong></div>'); });
    return '<button class="back" data-go="chevrerie">' + ICON.retour + 'Chèvrerie</button>' +
      '<h2>Lait du tank</h2><div class="sub">Relevé du <input class="date" type="date" id="l-date" value="' + L.date + '"></div>' +
      '<div class="note">Ce relevé du matin comprend le lait de <strong>hier soir</strong> et celui de <strong>ce matin</strong>.</div>' +
      '<div class="card"><label for="l-litres">Litres lus au tank</label><div class="row"><input class="big" id="l-litres" inputmode="decimal" autocomplete="off" placeholder="0" value="' + esc(L.litres) + '"><span style="font-size:28px;font-weight:600;color:var(--muted)">L</span></div></div>' +
      '<div style="margin-top:14px;font-size:14px;font-weight:600;color:var(--muted)">Ce relevé couvre</div>' +
      '<div class="seg" id="l-jours">' + [1, 2, 3].map(function (j) { return '<button data-j="' + j + '"' + (L.jours === j ? ' class="on"' : '') + '>' + j + ' jour' + (j > 1 ? 's' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="small" style="margin-top:8px">Pas de relevé hier ? Choisissez « 2 jours » : le lait est réparti sur les deux jours.</div>' +
      '<div class="card"><label>Derniers relevés</label><div class="list">' + (hist.join('') || '<div><span class="small">Aucun relevé pour l\'instant.</span></div>') + '</div></div>' +
      '<button class="btn" id="l-save">Enregistrer</button>';
  }

  function trouver(digits) {
    if (!troupeau || digits.length < 2) return [];
    var r = troupeau.chevres.filter(function (c) { return String(c.num).slice(-digits.length) === digits; });
    return r.slice(0, 8);
  }
  function lab(c) { return c.ordre || String(c.num).slice(-5); }
  function age(c) { if (!c.naiss) return ''; var j = Math.round((Date.now() - new Date(c.naiss + 'T12:00:00').getTime()) / 86400000); return j > 0 ? j + ' jours' : ''; }
  function derniere(c) {
    var loc = saisies.filter(function (s) { return s.type === 'pesee' && (s.chevre_id === c.id || (c.id == null && s.numero === c.num)); }).sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0];
    if (loc) return [loc.date, loc.kg];
    return c.pes || null;
  }
  function pesee() {
    return '<button class="back pink" data-go="chevrerie">' + ICON.retour + 'Chèvrerie</button>' +
      '<h2>Pesée</h2><div class="sub">' + esc(jourLong(aujourdhui())) + '</div>' +
      '<div class="card"><label for="p-num">N° de l\'animal <span style="font-weight:500">(les derniers chiffres suffisent)</span></label>' +
      '<input class="num" id="p-num" inputmode="numeric" autocomplete="off" placeholder="ex. 001" value="' + esc(P.num) + '"><div id="p-id"></div></div>' +
      '<div class="card"><label for="p-kg">Poids</label><div class="row"><input class="big" id="p-kg" inputmode="decimal" autocomplete="off" placeholder="0" value="' + esc(P.kg) + '"><span style="font-size:28px;font-weight:600;color:var(--muted)">kg</span></div><div id="p-gain" class="small"></div></div>' +
      '<button class="btn pink" id="p-save">Enregistrer et animal suivant</button>' +
      '<div style="margin-top:14px;font-size:13px;font-weight:600;color:var(--muted)">Pesés aujourd\'hui</div><div class="pills" id="p-done"></div>';
  }
  function majPesee() {
    var digits = P.num.replace(/\D/g, '');
    var el = document.getElementById('p-id'); if (!el) return;
    var h = '';
    if (!troupeau) h = '<div class="small" style="margin-top:6px">Troupeau non chargé : entrez le numéro complet (5 chiffres).</div>';
    var m = trouver(digits);
    if (P.sel && (digits === '' || String(P.sel.num).slice(-digits.length) !== digits)) P.sel = null;
    if (!P.sel && m.length === 1) P.sel = m[0];
    if (!P.sel && !troupeau && digits.length >= 5) P.sel = { id: null, num: digits };
    if (P.sel) {
      var c = P.sel, d = derniere(c);
      h += '<div class="pills"><span class="pill on">' + esc(lab(c)) + '</span></div><div style="margin-top:6px;color:var(--pink);font-weight:600;font-size:15px">' + esc([c.cat ? c.cat.charAt(0) + c.cat.slice(1).toLowerCase() : '', c.naiss ? 'née le ' + dateFr(c.naiss) : '', age(c)].filter(Boolean).join(' · ')) + '</div>' +
        (d ? '<div class="small">Dernière pesée : ' + fr(d[1], 1) + ' kg le ' + esc(dateFr(d[0])) + '</div>' : '<div class="small">Pas encore de pesée enregistrée.</div>');
    } else if (m.length > 1) {
      h += '<div class="small" style="margin-top:6px">Plusieurs animaux : touchez le bon.</div><div class="pills">' + m.map(function (c) { return '<button class="pill" data-pick="' + c.id + '">' + esc(lab(c)) + '</button>'; }).join('') + '</div>';
    } else if (digits.length >= 2 && troupeau) {
      h += '<div class="small" style="margin-top:6px;color:#b3261e">Aucun animal ne se termine par ' + esc(digits) + '.</div>';
    }
    el.innerHTML = h;
    majGain();
  }
  function majGain() {
    var g = document.getElementById('p-gain'); if (!g) return;
    var kg = nb(P.kg), c = P.sel; g.textContent = '';
    if (kg == null || !c) return;
    var d = derniere(c); if (!d) return;
    var j = Math.round((new Date(aujourdhui()).getTime() - new Date(d[0]).getTime()) / 86400000);
    if (j > 0) { var gain = (kg - d[1]) / j * 1000; g.textContent = (kg >= d[1] ? '+' : '') + fr(kg - d[1], 1) + ' kg en ' + j + ' jours (' + (gain >= 0 ? '+' : '') + fr(gain, 0) + ' g/jour)'; }
  }
  function majFaits() {
    var el = document.getElementById('p-done'); if (!el) return;
    var t = aujourdhui();
    el.innerHTML = saisies.filter(function (s) { return s.type === 'pesee' && s.date === t; }).reverse().map(function (s) { return '<span class="pill done">' + esc(String(s.numero).slice(-5)) + ' · ' + fr(s.kg, 1) + '</span>'; }).join('');
  }

  function render() {
    $app.innerHTML = vue === 'lait' ? lait() : vue === 'pesee' ? pesee() : vue === 'chevrerie' ? chevrerie() : accueil();
    if (vue === 'pesee') { majPesee(); majFaits(); }
  }

  function enregistrerTank() {
    var l = nb(document.getElementById('l-litres').value);
    if (l == null || l <= 0 || l > 1000) { toast('Entrez les litres lus (un nombre, ex. 67,3).'); return; }
    var dt = document.getElementById('l-date').value || aujourdhui();
    saisies.push({ id: uid(), type: 'tank', date: dt, litres: l, jours: L.jours, saisi: new Date().toISOString(), sent: false });
    sauver(); toast('Relevé enregistré : ' + fr(l, 1) + ' L'); go('chevrerie');
  }
  function enregistrerPesee() {
    var kg = nb(P.kg), c = P.sel;
    if (!c) { toast('Choisissez d\'abord l\'animal.'); return; }
    if (kg == null || kg < 1 || kg > 120) { toast('Entrez un poids en kg (entre 1 et 120).'); return; }
    var t = aujourdhui();
    saisies = saisies.filter(function (s) { return !(s.type === 'pesee' && !s.sent && s.date === t && s.numero === c.num); });
    saisies.push({ id: uid(), type: 'pesee', date: t, numero: c.num, chevre_id: c.id, kg: kg, saisi: new Date().toISOString(), sent: false });
    sauver(); toast(lab(c) + ' : ' + fr(kg, 1) + ' kg enregistré');
    P = { num: '', sel: null, kg: '' }; render(); var i = document.getElementById('p-num'); if (i) i.focus();
  }

  async function envoyer(tous) {
    var lim = Date.now() - 30 * 86400000;
    var liste = tous ? saisies.filter(function (s) { return !s.sent || (s.sentAt || 0) > lim; }) : aEnvoyer();
    if (!liste.length) { toast('Rien à envoyer.'); return; }
    var d = new Date(), nom = 'rationneur_telephone_' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.json';
    var contenu = JSON.stringify({ version: 1, envoye: d.toISOString(), saisies: liste.map(function (s) { var o = {}; for (var k in s) if (k !== 'sent' && k !== 'sentAt') o[k] = s[k]; return o; }) });
    var fichier;
    try { fichier = new File([contenu], nom, { type: 'application/json' }); } catch (e) { fichier = null; }
    try {
      if (fichier && navigator.canShare && navigator.canShare({ files: [fichier] })) {
        await navigator.share({ files: [fichier], title: 'Piloterie : résultats' });
      } else {
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([contenu], { type: 'application/json' })); a.download = nom; document.body.appendChild(a); a.click(); a.remove();
      }
    } catch (e) {
      if (e && e.name === 'AbortError') { toast('Envoi annulé : rien n\'est perdu.'); return; }
      toast('Envoi impossible : vos saisies sont conservées.'); return;
    }
    var maintenant = Date.now();
    liste.forEach(function (s) { s.sent = true; s.sentAt = maintenant; });
    sauver(); toast('Envoyé. Importez le fichier dans le rationneur.'); render();
  }
  function chargerTroupeau(f) {
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var d = JSON.parse(fr.result);
        if (!d || !Array.isArray(d.chevres)) throw new Error('x');
        troupeau = d; ecrire('rt_troupeau', d); toast('Troupeau chargé : ' + d.chevres.length + ' animaux'); render();
      } catch (e) { toast('Ce fichier n\'est pas un fichier troupeau.'); }
    };
    fr.readAsText(f);
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('button,a'); if (!t) return;
    if (t.dataset.go) { go(t.dataset.go); return; }
    if (t.id === 'envoyer') { envoyer(false); return; }
    if (t.id === 'renvoyer') { e.preventDefault(); envoyer(true); return; }
    if (t.id === 'l-save') { enregistrerTank(); return; }
    if (t.id === 'p-save') { enregistrerPesee(); return; }
    if (t.dataset.j) { L.jours = Number(t.dataset.j); L.litres = document.getElementById('l-litres').value; render(); return; }
    if (t.dataset.pick) { P.sel = troupeau.chevres.filter(function (c) { return String(c.id) === t.dataset.pick; })[0] || null; P.num = P.sel ? String(P.sel.num).slice(-Math.max(P.num.length, 3)) : P.num; document.getElementById('p-num').value = P.num; majPesee(); return; }
    if (t.dataset.del) { saisies = saisies.filter(function (s) { return s.id !== t.dataset.del; }); sauver(); render(); toast('Relevé supprimé.'); }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'p-num') { P.num = e.target.value.replace(/\D/g, ''); P.sel = null; majPesee(); }
    if (e.target.id === 'p-kg') { P.kg = e.target.value; majGain(); }
    if (e.target.id === 'l-litres') L.litres = e.target.value;
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'fichier' && e.target.files[0]) chargerTroupeau(e.target.files[0]);
    if (e.target.id === 'l-date') L.date = e.target.value;
  });
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () { /* hors ligne non disponible */ });
})();
