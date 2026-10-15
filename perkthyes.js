// perkthyes.js - Perkthyesi Eagle Script <-> JavaScript (me skaner te vertete)
//
// Versioni i vjeter perdorte shprehje te rregullta mbi gjithe tekstin. Kjo
// shkaktonte gabime: koment '#' pas nje stringu e thyente programin, fjalet
// brenda ${...} te template-ve nuk perkthehesin, celesat e objekteve ({ne: 1})
// ndryshonin, dhe numrat e rreshtave humbisnin. Ketu kodi lexohet karakter
// pas karakteri dhe dihet gjithmone nese jemi brenda stringu, komenti,
// template-i, regex-i ose kodi normal.
//
// Rregull i rendesishem: perkthimi RUAN nje-me-nje rreshtat e burimit
// (komentet '#' hiqen por nderrimi i rreshtit mbetet), keshtu gabimet ne
// kodin e perkthyer tregojne rreshtin e sakte te skedarit .es.

'use strict';

const path = require('path');

// ─── Fjalet kyce: Eagle Script -> JavaScript ────────────────────────────────
// Fjaloret kane prototip null: pa kete, emra JS si toString/constructor do te gjendeshin
// gabimisht ne fjalor (obj["toString"] ekziston ne cdo objekt).
const FJALOR = Object.assign(Object.create(null), {
    'leje':             'let',
    'konstante':        'const',
    'nese':             'if',
    'ndryshe_nese':     'else if',
    'ndryshe':          'else',
    'per':              'for',
    'ndersa':           'while',
    'bej':              'do',
    'ndalo':            'break',
    'vazhdo':           'continue',
    'kthe':             'return',
    'funksion':         'function',
    'klase':            'class',
    'i_ri':             'new',
    'fshi':             'delete',
    'ne':               'in',
    'te':               'of',          // vetem brenda per ( ... te ... )
    'provo':            'try',
    'kap':              'catch',
    'perfundimisht':    'finally',
    'hedh':             'throw',
    'eksporto':         'export',
    'importo':          'import',
    'vertete':          'true',
    'gabim_val':        'false',
    'asnje':            'null',
    'i_papercaktuar':   'undefined',
    'eshte':            '===',
    'nuk_eshte':        '!==',
    'instanceof_al':    'instanceof',
    // --- Te reja (README i vjeter i perdorte por nuk ekzistonin) ---
    'kete':             'this',
    'konstruktor':      'constructor',
    'ndryshon':         'extends',
    'prindi':           'super',
    'statik':           'static',
    'nderro':           'switch',
    'rasti':            'case',
    'paracaktuar':      'default',
});

// Funksione globale dhe metoda (ato qe fillojne me '.' perkthehen vetem pas pikes).
const FUNKSIONE = Object.assign(Object.create(null), {
    'shfaq':        'console.log',
    'paralajmero':  'console.warn',
    'gabim_log':    'console.error',
    'lexo':         'prompt',
    'gjatesia':     '.length',
    'llojiOf':      'typeof',
    'ShtoNe':       '.push',
    'HeqNga':       '.pop',
    'HeqFill':      '.shift',
    'ShtoFill':     '.unshift',
    'bashko':       '.join',
    'ndaj':         '.split',
    'prerje':       '.slice',
    'gjej':         '.indexOf',
    'filtro':       '.filter',
    'harton':       '.map',
    'zvoglo':       '.reduce',
    'per_secilin':  '.forEach',
    'rendito':      '.sort',
    'anasjelltas':  '.reverse',
    'perfshin':     '.includes',
    'bashkoje':     '.concat',
    'stringjeso':   '.toString',
    'numroje':      'parseInt',
    'numroje_dec':  'parseFloat',
    'eshte_NaN':    'isNaN',
    'shto_Math':    'Math.max',
    'vogel_Math':   'Math.min',
    'rrumbullakoset': 'Math.round',
    'dyshja':       'Math.floor',
    'tavani':       'Math.ceil',
    'katrori':      'Math.sqrt',
    'fuqia':        'Math.pow',
    'rastesi':      'Math.random',
    'abs_val':      'Math.abs',
    'JSON_ne_tekst': 'JSON.stringify',
    'tekst_ne_JSON': 'JSON.parse',
    'Varg':         'Array',
    'Objekt':       'Object',
    'celesat':      'Object.keys',
    'vlerat_obj':   'Object.values',
    'hyrjet':       'Object.entries',
    'kopjo_obj':    'Object.assign',
    'ngrij_obj':    'Object.freeze',
    'Shuma':        'Number',
    'Tekst':        'String',
    'Boolean_al':   'Boolean',
    'prit':         'setTimeout',
    'prit_interval': 'setInterval',
    'anulo_prit':   'clearTimeout',
    'anulo_interval': 'clearInterval',
    'premtim':      'Promise',
    'async_al':     'async',
    'prite':        'await',
});

// Metodat (pas pikes) dhe funksionet globale ndahen nje here, ne fillim.
const METODA = Object.create(null);      // 'filtro' -> 'filter'
const GLOBALE = Object.create(null);     // 'shfaq'  -> 'console.log'
for (const [sh, js] of Object.entries(FUNKSIONE)) {
    if (js.startsWith('.')) METODA[sh] = js.slice(1);
    else GLOBALE[sh] = js;
}

// Fjale pas te cilave nje '/' fillon nje regex (jo pjesetim).
const PARA_REGEX = new Set([
    'kthe', 'hedh', 'ne', 'te', 'eshte', 'nuk_eshte', 'instanceof_al',
    'llojiOf', 'fshi', 'i_ri', 'prite', 'ndryshe', 'bej', 'rasti',
    'return', 'throw', 'in', 'of', 'typeof', 'delete', 'new', 'await', 'else', 'do', 'case',
]);

const ID_START = /[\p{L}_$]/u;
const ID_PART = /[\p{L}\p{N}_$]/u;

// ─── Skaneri i perbashket (para dhe mbrapa) ───────────────────────────────
//
// Kalon mbi burimin dhe i kopjon pa e prekur stringjet, komentet, regex-et.
// Per cdo fjale (identifikator) therret `opsione.fjale(fjala, gjendja)` qe
// kthen tekstin zevendesues (ose { tekst, fund } nese "ha" edhe karaktere pas fjales).
//
// opsione:
//   hashKoment  true  -> '#' fillon koment (vetem per Eagle Script)
//   fjalaFor    fjala qe hap nje cikel for ('per' ose 'for')
//   operatoret  { '===': 'eshte', ... } zevendesime operatoresh (vetem ne drejtimin mbrapsht)
//   fjale       funksioni i mesiperm
function skano(burim, opsione) {
    const n = burim.length;
    let i = 0;
    // Gjendja e thirrjes sone (e pavarur per cdo ${...} te nderthurur).
    return kod(false);

    function kod(brendaTemplate) {
        let out = '';
        let prev = { tipi: 'asgje', tekst: '' };
        const kllapa = [];          // pirg: true = kllapa e nje cikli for
        let pritetFor = false;
        let thellesiaGrep = 0;

        while (i < n) {
            const c = burim[i];

            if (/\s/.test(c)) { out += c; i++; continue; }

            // --- Komente ---
            if (c === '#' && opsione.hashKoment) {
                while (i < n && burim[i] !== '\n') i++;
                continue;
            }
            if (c === '/' && burim[i + 1] === '/') {
                while (i < n && burim[i] !== '\n') out += burim[i++];
                continue;
            }
            if (c === '/' && burim[i + 1] === '*') {
                const fund = burim.indexOf('*/', i + 2);
                const deri = fund === -1 ? n : fund + 2;
                out += burim.slice(i, deri);
                i = deri;
                continue;
            }

            const ishtePritur = pritetFor;
            pritetFor = false;

            // --- Stringje ---
            if (c === '"' || c === "'") {
                let j = i + 1;
                while (j < n && burim[j] !== c && burim[j] !== '\n') {
                    j += burim[j] === '\\' ? 2 : 1;
                }
                j = Math.min(j + 1, n);
                out += burim.slice(i, j);
                i = j;
                prev = { tipi: 'tekst', tekst: '' };
                continue;
            }

            // --- Template literals (me perkthim brenda ${...}) ---
            if (c === '`') {
                out += '`';
                i++;
                while (i < n && burim[i] !== '`') {
                    if (burim[i] === '\\') { out += burim.slice(i, i + 2); i += 2; continue; }
                    if (burim[i] === '$' && burim[i + 1] === '{') {
                        out += '${';
                        i += 2;
                        out += kod(true);          // perkthen shprehjen deri te '}' perkates
                        if (burim[i] === '}') { out += '}'; i++; }
                        continue;
                    }
                    out += burim[i++];
                }
                if (i < n) { out += '`'; i++; }
                prev = { tipi: 'tekst', tekst: '' };
                continue;
            }

            // --- Numra ---
            if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(burim[i + 1] || ''))) {
                let j = i + 1;
                while (j < n && /[0-9a-zA-Z_]/.test(burim[j])) j++;
                if (burim[j] === '.' && /[0-9]/.test(burim[j + 1] || '')) {
                    j++;
                    while (j < n && /[0-9a-zA-Z_]/.test(burim[j])) j++;
                }
                out += burim.slice(i, j);
                i = j;
                prev = { tipi: 'numer', tekst: '' };
                continue;
            }

            // --- Regex literal (kur '/' nuk mund te jete pjesetim) ---
            if (c === '/') {
                const regexMundshem =
                    prev.tipi === 'asgje' ||
                    (prev.tipi === 'pikesim' && ![')', ']'].includes(prev.tekst)) ||
                    (prev.tipi === 'fjale' && PARA_REGEX.has(prev.tekst));
                if (regexMundshem) {
                    let j = i + 1;
                    let klase = false;
                    while (j < n && burim[j] !== '\n') {
                        if (burim[j] === '\\') { j += 2; continue; }
                        if (burim[j] === '[') klase = true;
                        else if (burim[j] === ']') klase = false;
                        else if (burim[j] === '/' && !klase) break;
                        j++;
                    }
                    j++;
                    while (j < n && /[a-z]/.test(burim[j])) j++;
                    out += burim.slice(i, j);
                    i = j;
                    prev = { tipi: 'tekst', tekst: '' };
                    continue;
                }
            }

            // --- Fjale / identifikatore ---
            if (ID_START.test(c)) {
                let j = i + 1;
                while (j < n && ID_PART.test(burim[j])) j++;
                const fjala = burim.slice(i, j);

                // karakteri i pare jo-hapesire pas fjales
                let k = j;
                while (k < n && /\s/.test(burim[k])) k++;
                const tjeter = burim[k] || '';

                const gjendja = {
                    prejPike: prev.tipi === 'pikesim' && prev.tekst === '.',
                    celes: tjeter === ':' && burim[k + 1] !== ':' &&
                        prev.tipi === 'pikesim' && (prev.tekst === '{' || prev.tekst === ','),
                    brendaFor: kllapa.length > 0 && kllapa[kllapa.length - 1] === true,
                    fjalaParaardhese: prev.tipi === 'fjale' ? prev.tekst : '',
                    tjeter,
                    burim,
                    fund: j,
                };

                const rezultat = opsione.fjale(fjala, gjendja);
                if (typeof rezultat === 'string') {
                    out += rezultat;
                    i = j;
                } else {
                    out += rezultat.tekst;
                    i = rezultat.fund;
                }
                if (fjala === opsione.fjalaFor && !gjendja.prejPike) pritetFor = true;
                prev = { tipi: 'fjale', tekst: fjala };
                continue;
            }

            // --- Operatore me shume karaktere (p.sh. === ne drejtimin mbrapsht) ---
            if (opsione.operatoret) {
                let gjetur = false;
                for (const op of ['===', '!==']) {
                    if (burim.startsWith(op, i) && opsione.operatoret[op]) {
                        // hapesira rreth fjales vetem nese mungojne ne burim
                        const para = out.length && !/\s/.test(out[out.length - 1]) ? ' ' : '';
                        const pas = /\s/.test(burim[i + op.length] || ' ') ? '' : ' ';
                        out += para + opsione.operatoret[op] + pas;
                        i += op.length;
                        prev = { tipi: 'pikesim', tekst: op };
                        gjetur = true;
                        break;
                    }
                }
                if (gjetur) continue;
            }

            // --- Pikesim ---
            if (c === '.' && burim.startsWith('...', i)) {
                out += '...';
                i += 3;
                prev = { tipi: 'pikesim', tekst: '...' };
                continue;
            }
            if (c === '(') kllapa.push(ishtePritur);
            else if (c === ')') kllapa.pop();
            else if (c === '{') thellesiaGrep++;
            else if (c === '}') {
                if (brendaTemplate && thellesiaGrep === 0) return out;   // fundi i ${...}
                thellesiaGrep--;
            }
            out += c;
            i++;
            prev = { tipi: 'pikesim', tekst: c };
        }
        return out;
    }
}

// Emrat qe perdoruesi i percakton vetë si metoda/funksione (p.sh. 'filtro(x) { ... }').
// Per keto NUK e perkthejme '.filtro' ne '.filter', perndryshe thirrja nuk do
// gjente metoden e perdoruesit.
function emratEPerdoruesit(burim) {
    const emrat = new Set();
    const re = /(?:^|[\s;{}])([\p{L}_$][\p{L}\p{N}_$]*)\s*\([^()]*\)\s*\{/gmu;
    let m;
    while ((m = re.exec(burim)) !== null) {
        if (METODA[m[1]] !== undefined && !(m[1] in FJALOR)) emrat.add(m[1]);
    }
    return emrat;
}

// ─── Perkthyesi: Eagle Script -> JavaScript ────────────────────────────────
class Perkthyes {
    /**
     * @param {object} [opsione]
     * @param {string[]} [opsione.funksioneGUI]  emrat e funksioneve GUI qe importohen automatikisht
     */
    constructor(opsione = {}) {
        this.fjalor = FJALOR;
        this.funksione = FUNKSIONE;
        this.funksioneGUI = opsione.funksioneGUI || require('./gui').EMRAT_GUI;
    }

    perkthe(kodiBurim) {
        const tePerdoruesit = emratEPerdoruesit(kodiBurim);

        let kodiJS = skano(kodiBurim, {
            hashKoment: true,
            fjalaFor: 'per',
            fjale: (fjala, g) => {
                // Pas pikes: vetem metodat e njohura (.filtro, .gjatesia, ...).
                if (g.prejPike) {
                    if (METODA[fjala] !== undefined && !tePerdoruesit.has(fjala)) return METODA[fjala];
                    return fjala;
                }
                // Celes objekti ({ne: 1}): mbetet siç eshte.
                if (g.celes) return fjala;

                if (fjala === 'te') return g.brendaFor ? 'of' : 'te';

                if (fjala === 'klase') {
                    // 'klase' si fjale kyce: klase Emri {...}  ose  klase {...}
                    // 'klase' si emer ndryshoreje (leje klase = 1) -> klase_var
                    const eshteDeklarim = g.fjalaParaardhese !== 'leje' &&
                        g.fjalaParaardhese !== 'konstante' &&
                        (g.tjeter === '{' || ID_START.test(g.tjeter));
                    return eshteDeklarim ? 'class' : 'klase_var';
                }

                if (FJALOR[fjala] !== undefined) return FJALOR[fjala];
                if (GLOBALE[fjala] !== undefined) return GLOBALE[fjala];
                return fjala;
            },
        });

        // Nese kodi perdor funksione GUI, shto importin automatik te gui.js.
        // E vendosim ne RRESHTIN E PARE pa nderrim rreshti, qe numrat e
        // rreshtave te mos zhvendosen. Shtegu eshte absolut, qe skedari .js i
        // perkthyer te funksionoje kudo qe ruhet.
        const perdorGUI = this.funksioneGUI.some((fn) => new RegExp(`(^|[^\\p{L}\\p{N}_$.])${fn}(?![\\p{L}\\p{N}_$])`, 'u').test(kodiJS));
        if (perdorGUI) {
            const shtegulGui = path.join(__dirname, 'gui.js').replace(/\\/g, '/');
            kodiJS = `const { ${this.funksioneGUI.join(', ')} } = require('${shtegulGui}'); ` + kodiJS;
        }

        return kodiJS;
    }
}

// ─── Perkthyesi mbrapsht: JavaScript -> Eagle Script ───────────────────────
class PerkthyesMbrapsht {
    constructor() {
        // js -> shqip per fjalet kyce (pa operatoret, qe trajtohen veçmas)
        this.fjalorMbrapsht = Object.create(null);
        for (const [sh, js] of Object.entries(FJALOR)) {
            if (js === '===' || js === '!==' || js === 'else if' || js === 'of') continue;
            this.fjalorMbrapsht[js] = sh;
        }
        // metoda: js -> shqip (length -> gjatesia ...)
        this.metodaMbrapsht = Object.create(null);
        for (const [sh, js] of Object.entries(METODA)) this.metodaMbrapsht[js] = sh;
        // globale me nje fjale (Array -> Varg, parseInt -> numroje)
        this.globaleMbrapsht = Object.create(null);
        // globale me pike (console.log -> shfaq, Math.max -> shto_Math)
        this.globaleMePike = Object.create(null);
        for (const [sh, js] of Object.entries(GLOBALE)) {
            if (js.includes('.')) this.globaleMePike[js] = sh;
            else this.globaleMbrapsht[js] = sh;
        }
    }

    perktheMbrapsht(kodiJS) {
        return skano(kodiJS, {
            hashKoment: false,
            fjalaFor: 'for',
            operatoret: { '===': 'eshte', '!==': 'nuk_eshte' },
            fjale: (fjala, g) => {
                if (g.prejPike) {
                    return this.metodaMbrapsht[fjala] !== undefined ? this.metodaMbrapsht[fjala] : fjala;
                }
                if (g.celes) return fjala;

                // console.log, Math.max, JSON.stringify, Object.keys ...
                const m = /^\s*\.\s*([\p{L}_$][\p{L}\p{N}_$]*)/u.exec(g.burim.slice(g.fund));
                if (m) {
                    const emriPlote = `${fjala}.${m[1]}`;
                    if (this.globaleMePike[emriPlote] !== undefined) {
                        return { tekst: this.globaleMePike[emriPlote], fund: g.fund + m[0].length };
                    }
                }

                if (fjala === 'else') {
                    const ndersa = /^\s+if(?![\p{L}\p{N}_$])/u.exec(g.burim.slice(g.fund));
                    if (ndersa) return { tekst: 'ndryshe_nese', fund: g.fund + ndersa[0].length };
                    return 'ndryshe';
                }
                if (fjala === 'of') return g.brendaFor ? 'te' : 'of';
                if (fjala === 'klase_var') return 'klase';

                if (this.fjalorMbrapsht[fjala] !== undefined) return this.fjalorMbrapsht[fjala];
                if (this.globaleMbrapsht[fjala] !== undefined) return this.globaleMbrapsht[fjala];
                return fjala;
            },
        });
    }
}

module.exports = { Perkthyes, PerkthyesMbrapsht, FJALOR, FUNKSIONE, METODA, GLOBALE };
