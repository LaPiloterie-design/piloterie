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

  function go(v) { vue = v; if (v === 'lait') L = { litres: '', jours: 1, date: aujourdhui() }; if (v === 'pesee') P = { num: '', sel: null, kg: '' }; if (v === 'qualite') Q = { tb: '', tp: '', lactose: '', sel: '', esd: '', densite: '', nett: null }; if (v === 'controle') C = nouveauControle(dateControleDefaut()); if (v === 'labo') { var dc0 = datesControle(); B = { date: dc0[0] || aujourdhui(), ech: '', tb: '', tp: '' }; } render(); window.scrollTo(0, 0); }

  function chevrerie() {
    var n = aEnvoyer().length;
    var chip = n ? '<span class="chip warn">' + n + ' à envoyer</span>' : '<span class="chip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Tout est envoyé</span>';
    var info = troupeau ? 'Troupeau chargé le ' + esc(dateFr((troupeau.genere || '').slice(0, 10))) + ' (' + troupeau.chevres.length + ' animaux).' : '<strong>Troupeau non chargé.</strong> Chargez le fichier « troupeau_rationneur.json » pour retrouver les chèvres par leur numéro.';
    return '<button class="back" data-go="accueil">' + ICON.retour + 'Piloterie</button><div class="top"><div><h1>Chèvrerie</h1></div>' + chip + '</div>' +
      '<div class="sub" style="margin-top:6px">' + esc(jourLong(aujourdhui())) + '</div>' +
      '<div class="tiles">' +
      '<button class="tile" data-go="lait">' + ICON.goutte + '<div style="flex:1"><b>Lait du tank</b><span>Relevé du matin : veille au soir + matin</span></div>' + ICON.fleche + '</button>' +
      '<button class="tile light" data-go="qualite">' + ICON.pulse + '<div style="flex:1"><b>Qualité du lait</b><span>Analyse du tank · nettoyage</span></div>' + ICON.fleche + '</button>' +
      '<button class="tile" data-go="controle">' + ICON.liste + '<div style="flex:1"><b>Contrôle individuel</b><span>Matin, soir et n° d\'échantillon</span></div>' + ICON.fleche + '</button>' +
      '<button class="tile light" data-go="labo">' + ICON.fiole + '<div style="flex:1"><b>Résultats du labo (TB / TP)</b><span>Saisis par n° d\'échantillon</span></div>' + ICON.fleche + '</button>' +
      '<button class="tile pink" data-go="pesee">' + ICON.pese + '<div style="flex:1"><b>Pesée</b><span>Cabris et chevrettes, un par un</span></div>' + ICON.fleche + '</button>' +
      '</div>' +
      '<button class="btn" id="envoyer"' + (n ? '' : ' style="background:var(--card);color:var(--ink);border:1.5px solid var(--border)"') + '>Envoyer les résultats' + (n ? ' (' + n + ')' : '') + '</button>' +
      '<div class="foot">' + info + '<br><label style="display:inline-block;margin-top:8px;color:var(--blue-ink);font-weight:600;text-decoration:underline;cursor:pointer">Charger le troupeau<input id="fichier" type="file" hidden></label>' +
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

  /* ===================== Qualité du lait ===================== */
  var NORMES = { tb: [3.7, 4.2], tp: [2.7, 3.2], lactose: [4.4, 4.7], sel: [0.7, 0.8], esd: [7.8, 8.7], densite: [1.026, 1.035] };
  var Q = { tb: '', tp: '', lactose: '', sel: '', esd: '', densite: '', nett: null };
  function histQualite() {
    var loc = saisies.filter(function (s) { return s.type === 'qualite'; }).map(function (s) { return { date: s.date, nettoyage: s.nettoyage }; });
    var d = (troupeau && troupeau.qualite) || [];
    return loc.concat(d).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  }
  function conseilNettoyage() {
    var h = histQualite(), q = 0, dernier = null;
    for (var i = 0; i < h.length; i++) { if (h[i].nettoyage === 'hebdomadaire') { dernier = h[i].date; break; } if (h[i].nettoyage === 'quotidien') q++; }
    var jours = dernier ? Math.round((Date.now() - new Date(dernier + 'T12:00:00').getTime()) / 86400000) : null;
    var reco = (dernier == null || jours >= 7 || q >= 6) ? 'hebdomadaire' : 'quotidien';
    return { reco: reco, jours: jours, q: q };
  }
  function qualite() {
    var c = conseilNettoyage(); if (!Q.nett) Q.nett = c.reco;
    var champs = [['tb', 'Matière grasse (TB) %'], ['tp', 'Protéines (TP) %'], ['lactose', 'Lactose %'], ['sel', 'Salinité %'], ['esd', 'Extrait sec dégraissé %'], ['densite', 'Densité']];
    var opt = [['rapide', '#9AA9A3', '<strong>Rapide</strong> : rinçage à l\'eau chaude, toujours'], ['quotidien', '#1E7A45', '<strong>Quotidien</strong> : flacon <strong>vert</strong> « MasterDaily » (alcalin), dilué à 1 %'], ['hebdomadaire', '#C23A3A', '<strong>Hebdomadaire</strong> : flacon <strong>rouge</strong> « MasterWeekly » (acide), dilué à 1 %']];
    return '<button class="back" data-go="chevrerie">' + ICON.retour + 'Chèvrerie</button><h2>Qualité du lait</h2><div class="sub">Analyse du lait du tank · ' + esc(dateFr(aujourdhui())) + '</div>' +
      '<div class="note">Analysez l\'échantillon <strong>2 fois</strong> et notez la <strong>2e analyse</strong> (appareil réglé sur « lait de chèvre »).</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">' + champs.map(function (f) {
        var n = NORMES[f[0]];
        return '<label class="card" style="margin:0;padding:8px 12px"><span style="font-size:12px;font-weight:600;color:var(--muted)">' + f[1] + '</span><input class="q-in" data-k="' + f[0] + '" inputmode="decimal" autocomplete="off" value="' + esc(Q[f[0]]) + '" style="display:block;width:100%;border:0;outline:0;background:transparent;font-size:24px;font-weight:700;padding:2px 0 0"><span class="small">norme ' + String(n[0]).replace('.', ',') + ' à ' + String(n[1]).replace('.', ',') + '</span></label>';
      }).join('') + '</div>' +
      '<div class="row" style="margin-top:8px"><div class="chip" style="flex:1;display:block;border-radius:12px">Ratio TB / TP<div id="q-ratio" style="font-size:24px;font-weight:700;color:var(--ink)">–</div></div><div class="chip" style="flex:1;display:block;border-radius:12px">Extrait sec total<div id="q-est" style="font-size:24px;font-weight:700;color:var(--ink)">–</div></div></div>' +
      '<div class="card"><label>Nettoyage de l\'appareil après l\'analyse</label><div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">' + opt.map(function (o) {
        return '<button data-nett="' + o[0] + '" style="display:flex;align-items:center;gap:10px;text-align:left;border-radius:12px;padding:8px 10px;cursor:pointer;background:' + (Q.nett === o[0] ? 'var(--ok)' : 'var(--card)') + ';border:' + (Q.nett === o[0] ? '2px solid #1E7A45' : '1.5px solid var(--border)') + '"><span style="width:14px;height:14px;border-radius:50%;background:' + o[1] + ';flex:none"></span><span style="font-size:13.5px;line-height:1.3">' + o[2] + '</span></button>';
      }).join('') + '</div><div class="small" style="margin-top:8px">Un hebdomadaire au moins une fois par semaine, jamais plus de 6 quotidiens de suite. <strong style="color:var(--ink)">' + (c.jours == null ? 'Aucun hebdomadaire enregistré.' : 'Dernier hebdomadaire : il y a ' + c.jours + ' jour' + (c.jours > 1 ? 's' : '') + '.') + ' Conseillé aujourd\'hui : ' + (c.reco === 'hebdomadaire' ? 'hebdomadaire (rouge)' : 'quotidien (vert)') + '.</strong></div></div>' +
      '<button class="btn" id="q-save">Enregistrer l\'analyse</button>';
  }
  function majQualite() {
    var tb = nb(Q.tb), tp = nb(Q.tp), esd = nb(Q.esd), r = document.getElementById('q-ratio'), e = document.getElementById('q-est');
    if (r) r.textContent = tb != null && tp ? fr(tb / tp, 2) : '–';
    if (e) e.textContent = tb != null && esd != null ? fr(tb + esd, 1) + ' %' : '–';
  }
  function enregistrerQualite() {
    var o = { id: uid(), type: 'qualite', date: aujourdhui(), nettoyage: Q.nett, saisi: new Date().toISOString(), sent: false };
    var ks = ['tb', 'tp', 'lactose', 'sel', 'esd', 'densite'];
    for (var i = 0; i < ks.length; i++) { var v = nb(Q[ks[i]]); if (v == null && (ks[i] === 'tb' || ks[i] === 'tp')) { toast('Entrez au moins la matière grasse et les protéines.'); return; } o[ks[i]] = v; }
    saisies.push(o); sauver(); toast('Analyse enregistrée'); go('chevrerie');
  }

  /* ===================== Contrôle individuel ===================== */
  var C = null;
  var oubliees = lire('rt_oubliees', []);
  function cfgTraites(d) { var c = lire('rt_cfg', {}); return c[d] === 1 ? 1 : 2; }
  function setTraites(d, n) { var c = lire('rt_cfg', {}); c[d] = n; ecrire('rt_cfg', c); }
  function dateControleDefaut() { var d = new Date(); if (d.getHours() >= 13) d.setDate(d.getDate() + 1); return iso(d); }
  function nouveauControle(date) {
    var t = cfgTraites(date);
    var h = new Date().getHours();
    return { date: date, traites: t, session: (t === 2 && h >= 13) ? 'soir' : 'matin', compteur: (C && C.compteur) || 1, num: '', sel: null, litres: '', absente: false, recontrole: null, showRest: false };
  }
  function entreesControle(date) { return saisies.filter(function (s) { return s.type === 'controle' && s.controle === date; }); }
  function ligneDe(c, date) {
    var r = { soir: null, matin: null, ech: null, absente: false };
    entreesControle(date).forEach(function (s) { if (s.numero === c.num) { r[s.session] = s; if (s.echantillon) r.ech = s.echantillon; } });
    return r;
  }
  function prochainEch(date) { var m = 0; entreesControle(date).forEach(function (s) { var n = parseInt(s.echantillon, 10); if (n > m) m = n; }); return m + 1; }
  function p3(n) { n = String(n); return n.length < 3 ? ('000' + n).slice(-3) : n; }
  function lactantes() { return troupeau ? troupeau.chevres.filter(function (c) { return c.cat === 'CHEVRE'; }) : []; }
  function tankDuJour(date) {
    var t = saisies.filter(function (s) { return s.type === 'tank' && s.date === date; })[0];
    if (t) return t.litres / (t.jours || 1);
    var h = troupeau && troupeau.tank ? troupeau.tank.filter(function (x) { return x.date === date; })[0] : null;
    return h ? h.litres : null;
  }
  function dimJours(c) { if (!c.mb) return ''; var j = Math.round((Date.now() - new Date(c.mb + 'T12:00:00').getTime()) / 86400000); return j > 0 ? j + ' j de<br>lactation' : ''; }
  function faitesSession() { var ids = {}; entreesControle(C.date).forEach(function (s) { if (s.session === C.session) ids[s.numero] = 1; }); return ids; }
  function controle() {
    var tk = tankDuJour(C.date), fa = faitesSession(), nf = Object.keys(fa).length;
    var rest = lactantes().filter(function (c) { return !fa[c.num]; });
    var ob = oubliees.filter(function (o) { return o.controle < C.date; });
    var s2 = C.traites === 2;
    return '<div class="top"><button class="back" data-go="chevrerie">' + ICON.retour + 'Chèvrerie</button>' + (tk != null ? '<span class="chip" style="background:var(--blue-bg);color:var(--blue-ink)">Lait du tank : ' + fr(tk, 1) + ' L</span>' : '') + '</div>' +
      '<h2 style="font-size:24px">Contrôle du <input class="date" type="date" id="c-date" value="' + C.date + '"></h2>' +
      '<div class="row" style="margin-top:10px"><span class="small" style="width:64px;font-weight:600">Traites par jour</span><div class="seg" style="flex:1;margin:0" id="c-traites"><button data-t="1"' + (C.traites === 1 ? ' class="on"' : '') + '>1 traite</button><button data-t="2"' + (s2 ? ' class="on"' : '') + '>2 traites</button></div></div>' +
      (s2 ? '<div class="seg" id="c-sess"><button data-s="soir"' + (C.session === 'soir' ? ' class="on"' : '') + '>Soir d\'hier</button><button data-s="matin"' + (C.session === 'matin' ? ' class="on"' : '') + '>Matin</button></div>' : '') +
      '<div class="small" style="margin-top:6px">' + (C.session === 'soir' ? 'Traite du soir' : 'Traite du matin') + ' · ' + nf + ' faite' + (nf > 1 ? 's' : '') + (troupeau ? ' · ' + rest.length + ' restante' + (rest.length > 1 ? 's' : '') : '') + '</div>' +
      (ob.length ? '<div class="note warn" style="margin-top:10px"><strong>À recontrôler (' + ob.length + ')</strong> : ' + ob.map(function (o) { return '<button class="pill" style="padding:4px 10px;font-size:14px" data-rec="' + o.id + '|' + o.controle + '">' + esc(String(o.numero).slice(-5)) + '</button>'; }).join(' ') + '</div>' : '') +
      (C.recontrole ? '<div class="note warn" style="margin-top:10px">Recontrôle du contrôle du ' + esc(dateFr(C.recontrole)) + '. <a href="#" id="c-annule-rec" style="color:inherit;font-weight:700">Annuler</a></div>' : '') +
      '<div class="card" style="border:2px solid var(--blue)"><label for="c-num">N° de la chèvre <span style="font-weight:500">(derniers chiffres)</span></label><input class="num" id="c-num" inputmode="numeric" autocomplete="off" value="' + esc(C.num) + '"><div id="c-id"></div></div>' +
      '<div class="card" id="c-fields"></div>' +
      '<button class="btn" id="c-save">Enregistrer et chèvre suivante</button>' +
      '<div class="row" style="justify-content:space-between;margin-top:12px;font-size:13px;font-weight:600"><button class="pill done" style="background:var(--card);color:var(--ink);border:1.5px solid var(--border)" id="c-rest">Restantes · ' + rest.length + '</button><a href="#" id="c-oubli" style="color:#8A4B00;text-decoration:underline">Pas relevée : refaire demain</a></div>' +
      (C.showRest ? '<div class="pills">' + rest.map(function (c) { return '<button class="pill" data-pickc="' + c.id + '" style="font-size:15px">' + esc(lab(c)) + '</button>'; }).join('') + '</div>' : '');
  }
  function majControle() {
    var digits = C.num.replace(/\D/g, ''), m = trouver(digits), el = document.getElementById('c-id'); if (!el) return;
    if (C.sel && (digits === '' || String(C.sel.num).slice(-digits.length) !== digits)) C.sel = null;
    var avant = C.sel; if (!C.sel && m.length === 1) C.sel = m[0];
    if (!C.sel && !troupeau && digits.length >= 5) C.sel = { id: null, num: digits };
    var h = '';
    if (C.sel) {
      var l = ligneDe(C.sel, C.date);
      h = '<div class="row" style="gap:12px"><span class="pill on" style="background:var(--blue);font-size:18px">' + esc(lab(C.sel)) + '</span><span class="small">' + dimJours(C.sel) + '</span></div>';
      if (!avant || avant.num !== C.sel.num) { var ex = l[C.session]; C.litres = ex && ex.litres != null ? String(ex.litres).replace('.', ',') : ''; C.absente = !!(ex && ex.absente); if (ex && ex.compteur) C.compteur = ex.compteur; }
    } else if (m.length > 1) {
      h = '<div class="small" style="margin-top:6px">Plusieurs animaux : touchez le bon.</div><div class="pills">' + m.map(function (c) { return '<button class="pill" style="background:var(--blue-bg);color:var(--blue-ink)" data-pickc="' + c.id + '">' + esc(lab(c)) + '</button>'; }).join('') + '</div>';
    } else if (digits.length >= 2 && troupeau) h = '<div class="small" style="margin-top:6px;color:#b3261e">Aucun animal ne se termine par ' + esc(digits) + '.</div>';
    el.innerHTML = h; majChamps();
  }
  function majChamps() {
    var el = document.getElementById('c-fields'); if (!el) return;
    var c = C.sel, l = c ? ligneDe(c, C.date) : { soir: null, matin: null, ech: null };
    var ech = c ? (l.ech || prochainEch(C.date)) : null;
    var autre = C.session === 'matin' ? l.soir : l.matin;
    el.innerHTML = '<div class="row" style="justify-content:space-between"><div class="row" style="gap:6px"><span class="small" style="font-weight:600">Compteur</span>' + [1, 2, 3, 4].map(function (n) { return '<button data-cpt="' + n + '" style="width:38px;height:38px;border-radius:50%;font-weight:700;cursor:pointer;border:1.5px solid ' + (C.compteur === n ? 'var(--blue)' : 'var(--border)') + ';background:' + (C.compteur === n ? 'var(--blue)' : 'var(--card)') + ';color:' + (C.compteur === n ? '#fff' : 'var(--ink)') + '">' + n + '</button>'; }).join('') + '</div>' + (ech != null ? '<span class="chip" style="background:var(--blue-bg);color:var(--blue-ink);border-radius:8px;padding:5px 8px;font-size:12px">Éch. ' + p3(ech) + '</span>' : '') + '</div>' +
      '<div class="row" style="align-items:flex-end;margin-top:10px"><label style="flex:1;font-size:13px;color:var(--muted);font-weight:600">' + (C.session === 'matin' ? 'Matin' : 'Soir d\'hier') + ' (L)<input id="c-litres" inputmode="decimal" autocomplete="off" value="' + esc(C.litres) + '" style="display:block;width:100%;margin-top:3px;height:52px;border:2px solid var(--blue);border-radius:12px;padding:0 12px;font-size:24px;font-weight:700;background:var(--card)"></label>' +
      (C.traites === 2 ? '<div style="flex:1;font-size:13px;color:var(--muted);font-weight:600">' + (C.session === 'matin' ? 'Soir d\'hier' : 'Matin') + '<div style="margin-top:3px;height:52px;border-radius:12px;background:var(--line);display:flex;align-items:center;padding:0 12px;font-size:24px;font-weight:700;color:var(--muted)">' + (autre && autre.litres != null ? fr(autre.litres, 2).replace(/,?0+$/, '') : '–') + '</div></div>' : '') +
      '<label style="width:70px;font-size:12px;color:var(--muted);font-weight:600;text-align:center">Absente<input type="checkbox" id="c-abs" ' + (C.absente ? 'checked ' : '') + 'style="display:block;margin:3px auto 0;width:52px;height:52px"></label></div>';
  }
  function enregistrerControle() {
    var c = C.sel; if (!c) { toast('Choisissez d\'abord la chèvre.'); return; }
    var l = nb(C.litres);
    if (!C.absente && (l == null || l < 0 || l > 15)) { toast('Entrez les litres de la traite (ex. 1,9).'); return; }
    var ctrl = C.recontrole || C.date;
    var ex = entreesControle(ctrl);
    var ech = null; ex.forEach(function (s) { if (s.numero === c.num && s.echantillon) ech = s.echantillon; });
    if (!ech) { var m = 0; ex.forEach(function (s) { var n = parseInt(s.echantillon, 10); if (n > m) m = n; }); ech = String(m + 1); }
    var cle = function (s) { return s.type === 'controle' && s.controle === ctrl && s.numero === c.num && s.session === C.session && !s.sent; };
    var remp = saisies.some(cle); saisies = saisies.filter(function (s) { return !cle(s); });
    saisies.push({ id: uid(), type: 'controle', controle: ctrl, session: C.session, numero: c.num, chevre_id: c.id, litres: C.absente ? null : l, absente: !!C.absente, compteur: C.compteur, echantillon: ech, traites: C.traites, recontrole: C.recontrole ? aujourdhui() : null, saisi: new Date().toISOString(), sent: false });
    if (C.recontrole) oubliees = oubliees.filter(function (o) { return !(o.controle === C.recontrole && o.numero === c.num); }), ecrire('rt_oubliees', oubliees);
    sauver(); toast(lab(c) + (remp ? ' : valeur remplacée' : ' : enregistrée') + (C.absente ? ' (absente)' : ''));
    var keep = { date: C.date, traites: C.traites, session: C.session, compteur: C.compteur };
    C = nouveauControle(C.date); C.traites = keep.traites; C.session = keep.session; C.compteur = keep.compteur;
    render(); var i = document.getElementById('c-num'); if (i) i.focus();
  }

  /* ===================== Résultats du labo ===================== */
  var B = null;
  function datesControle() { var d = {}; saisies.forEach(function (s) { if (s.type === 'controle') d[s.controle] = 1; }); return Object.keys(d).sort().reverse(); }
  function laboVue() {
    var dc = datesControle();
    var ech = B.ech.replace(/\D/g, '').replace(/^0+/, '');
    var trouve = null; if (ech) entreesControle(B.date).forEach(function (s) { if (String(parseInt(s.echantillon, 10)) === ech) trouve = s; });
    var faits = saisies.filter(function (s) { return s.type === 'labo' && s.controle === B.date; });
    return '<button class="back" data-go="chevrerie">' + ICON.retour + 'Chèvrerie</button><h2>Résultats du labo</h2><div class="sub">TB / TP du contrôle du <input class="date" type="date" id="b-date" value="' + B.date + '"></div>' +
      '<div class="card"><label for="b-ech">N° d\'échantillon</label><input class="num" id="b-ech" inputmode="numeric" autocomplete="off" value="' + esc(B.ech) + '"><div class="small" id="b-qui" style="margin-top:4px">' + (trouve ? 'Chèvre <strong>' + esc(String(trouve.numero).slice(-5)) + '</strong>' : (ech ? 'Échantillon inconnu sur ce téléphone : il sera rattaché dans le rationneur.' : '')) + '</div></div>' +
      '<div class="row" style="margin-top:14px;gap:10px"><label class="card" style="margin:0;flex:1"><span class="small" style="font-weight:600">TB (g/L)</span><input id="b-tb" inputmode="decimal" autocomplete="off" value="' + esc(B.tb) + '" style="display:block;width:100%;border:0;outline:0;background:transparent;font-size:36px;font-weight:700"></label>' +
      '<label class="card" style="margin:0;flex:1"><span class="small" style="font-weight:600">TP (g/L)</span><input id="b-tp" inputmode="decimal" autocomplete="off" value="' + esc(B.tp) + '" style="display:block;width:100%;border:0;outline:0;background:transparent;font-size:36px;font-weight:700"></label></div>' +
      '<button class="btn" id="b-save">Enregistrer et échantillon suivant</button>' +
      '<div class="card"><label>Saisis pour ce contrôle (' + faits.length + ')</label><div class="pills">' + faits.slice().reverse().slice(0, 12).map(function (s) { return '<span class="pill done" style="background:var(--blue-bg);color:var(--blue-ink)">' + esc(String(parseInt(s.echantillon, 10))) + ' · ' + fr(s.tb, 1) + ' / ' + fr(s.tp, 1) + '</span>'; }).join('') + '</div></div>';
  }
  function enregistrerLabo() {
    var ech = B.ech.replace(/\D/g, '').replace(/^0+/, ''), tb = nb(B.tb), tp = nb(B.tp);
    if (!ech) { toast('Entrez le numéro d\'échantillon.'); return; }
    if (tb == null || tp == null || tb < 5 || tb > 120 || tp < 5 || tp > 100) { toast('TB et TP en g/L (ex. 35,2 et 32,1).'); return; }
    var cle = function (s) { return s.type === 'labo' && s.controle === B.date && String(parseInt(s.echantillon, 10)) === ech && !s.sent; };
    saisies = saisies.filter(function (s) { return !cle(s); });
    saisies.push({ id: uid(), type: 'labo', controle: B.date, echantillon: ech, tb: tb, tp: tp, saisi: new Date().toISOString(), sent: false });
    sauver(); toast('Échantillon ' + ech + ' : ' + fr(tb, 1) + ' / ' + fr(tp, 1));
    B.ech = String(parseInt(ech, 10) + 1); B.tb = ''; B.tp = ''; render(); var i = document.getElementById('b-tb'); if (i) i.focus();
  }

  function render() {
    $app.innerHTML = vue === 'lait' ? lait() : vue === 'pesee' ? pesee() : vue === 'qualite' ? qualite() : vue === 'controle' ? controle() : vue === 'labo' ? laboVue() : vue === 'chevrerie' ? chevrerie() : accueil();
    if (vue === 'pesee') { majPesee(); majFaits(); }
    if (vue === 'qualite') majQualite();
    if (vue === 'controle') majControle();
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
    if (t.id === 'q-save') { enregistrerQualite(); return; }
    if (t.dataset.nett) { Q.nett = t.dataset.nett; var sv = document.querySelectorAll('.q-in'); sv.forEach(function (i) { Q[i.dataset.k] = i.value; }); render(); return; }
    if (t.id === 'c-save') { enregistrerControle(); return; }
    if (t.id === 'b-save') { enregistrerLabo(); return; }
    if (t.dataset.t) { C.traites = Number(t.dataset.t); setTraites(C.date, C.traites); if (C.traites === 1) C.session = 'matin'; var n0 = C.num, s0 = C.sel; render(); return; }
    if (t.dataset.s) { C.session = t.dataset.s; var ex0 = C.sel ? ligneDe(C.sel, C.date)[C.session] : null; C.litres = ex0 && ex0.litres != null ? String(ex0.litres).replace('.', ',') : ''; C.absente = !!(ex0 && ex0.absente); render(); return; }
    if (t.dataset.cpt) { var lt = document.getElementById('c-litres'); if (lt) C.litres = lt.value; C.compteur = Number(t.dataset.cpt); majChamps(); return; }
    if (t.dataset.pickc) { C.sel = troupeau.chevres.filter(function (c) { return String(c.id) === t.dataset.pickc; })[0] || null; if (C.sel) { C.num = String(C.sel.num).slice(-Math.max(C.num.length, 3)); var ex1 = ligneDe(C.sel, C.date)[C.session]; C.litres = ex1 && ex1.litres != null ? String(ex1.litres).replace('.', ',') : ''; C.absente = false; C.showRest = false; render(); } return; }
    if (t.dataset.rec) { var pr = t.dataset.rec.split('|'), ob = oubliees.filter(function (o) { return o.id == pr[0] && o.controle === pr[1]; })[0]; if (ob) { C.recontrole = ob.controle; C.sel = troupeau ? troupeau.chevres.filter(function (c) { return c.num === ob.numero; })[0] || null : null; C.num = String(ob.numero).slice(-5); C.litres = ''; C.absente = false; render(); } return; }
    if (t.id === 'c-annule-rec') { e.preventDefault(); C.recontrole = null; render(); return; }
    if (t.id === 'c-rest') { C.showRest = !C.showRest; render(); return; }
    if (t.id === 'c-oubli') { e.preventDefault(); if (!C.sel) { toast('Choisissez d\'abord la chèvre pas relevée.'); return; } if (!oubliees.some(function (o) { return o.controle === C.date && o.numero === C.sel.num; })) oubliees.push({ id: C.sel.id, numero: C.sel.num, controle: C.date }); ecrire('rt_oubliees', oubliees); toast(lab(C.sel) + ' : à recontrôler demain'); C.num = ''; C.sel = null; C.litres = ''; render(); return; }
    if (t.dataset.del) { saisies = saisies.filter(function (s) { return s.id !== t.dataset.del; }); sauver(); render(); toast('Relevé supprimé.'); }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'p-num') { P.num = e.target.value.replace(/\D/g, ''); P.sel = null; majPesee(); }
    if (e.target.id === 'p-kg') { P.kg = e.target.value; majGain(); }
    if (e.target.id === 'l-litres') L.litres = e.target.value;
    if (e.target.classList && e.target.classList.contains('q-in')) { Q[e.target.dataset.k] = e.target.value; majQualite(); }
    if (e.target.id === 'c-num') { C.num = e.target.value.replace(/\D/g, ''); C.sel = null; majControle(); }
    if (e.target.id === 'c-litres') C.litres = e.target.value;
    if (e.target.id === 'b-ech') { B.ech = e.target.value; var el = document.getElementById('b-qui'); if (el) { var ee = B.ech.replace(/\D/g, '').replace(/^0+/, ''), tr = null; if (ee) entreesControle(B.date).forEach(function (s) { if (String(parseInt(s.echantillon, 10)) === ee) tr = s; }); el.innerHTML = tr ? 'Chèvre <strong>' + esc(String(tr.numero).slice(-5)) + '</strong>' : (ee ? 'Échantillon inconnu sur ce téléphone : il sera rattaché dans le rationneur.' : ''); } }
    if (e.target.id === 'b-tb') B.tb = e.target.value;
    if (e.target.id === 'b-tp') B.tp = e.target.value;
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'fichier' && e.target.files[0]) chargerTroupeau(e.target.files[0]);
    if (e.target.id === 'l-date') L.date = e.target.value;
    if (e.target.id === 'c-date' && e.target.value) { var k = C; C = nouveauControle(e.target.value); C.compteur = k.compteur; render(); }
    if (e.target.id === 'c-abs') C.absente = e.target.checked;
    if (e.target.id === 'b-date' && e.target.value) { B.date = e.target.value; render(); }
  });
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () { /* hors ligne non disponible */ });
})();
