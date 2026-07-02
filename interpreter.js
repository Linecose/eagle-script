// interpreter.js - Eagle Script Interpreter (I plotë dhe i korrigjuar)

const path = require('path');
const vm = require('vm');
const { Lexer } = require('./lexer');
const gui = require('./gui'); // Moduli GUI (NodeGui/Qt i mbeshtjellur ne shqip)

// ─── Keyword map: Eagle Script → JavaScript ───────────────────────────────────
const FJALOR = {
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
    'te':               'of',
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
};

const FUNKSIONE_SHTESORE = {
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
    'rrumbullakoset':'Math.round',
    'dyshja':       'Math.floor',
    'tavani':       'Math.ceil',
    'katrori':      'Math.sqrt',
    'fuqia':        'Math.pow',
    'rastesi':      'Math.random',
    'abs_val':      'Math.abs',
    'JSON_ne_tekst':'JSON.stringify',
    'tekst_ne_JSON':'JSON.parse',
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
    'prit_interval':'setInterval',
    'anulo_prit':   'clearTimeout',
    'anulo_interval':'clearInterval',
    'premtim':      'Promise',
    'async_al':     'async',
    'prite':        'await',
};

// ─── Funksionet GUI (te injektuara automatikisht ne vm nga ekzekuto(),
//     por qe duhen importuar shprehimisht ne cdo skedar .js te perkthyer
//     qe do te ekzekutohet i vetem, jashte interpretuesit) ───────────────────
const FUNKSIONET_GUI = ['krijo_dritare', 'buton_i_ri', 'tekst_i_ri', 'fushe_teksti'];

// ─── Translator: Albanian → JavaScript ────────────────────────────────────────
class Perkthyes {
    constructor() {
        this.fjalor = FJALOR;
        this.funksione = FUNKSIONE_SHTESORE;
    }

    perkthe(kodiBurim) {
        let kodiJS = kodiBurim;
        
        // 1. Fshij komentet me #
        kodiJS = kodiJS.replace(/(?<!["'`][^"'`\n]*)#[^\n]*/g, '');

        // 2. Izolo stringjet dhe template literals (që të mos ndryshojë asgjë brenda tyre)
        const stringet = [];
        kodiJS = kodiJS.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, (match) => {
            const placeholder = `__TEKST_${stringet.length}__`;
            stringet.push(match);
            return placeholder;
        });

        // 3. Përkthe fjalët kyçe strukturore (Përveç 'te' dhe 'klase' që duan trajtim specifik)
        const fjalorSpecifik = Object.entries(this.fjalor).filter(([k]) => k !== 'te' && k !== 'klase');
        for (const [shqip, js] of fjalorSpecifik) {
            const regex = new RegExp(`\\b${shqip}\\b`, 'g');
            kodiJS = kodiJS.replace(regex, js);
        }

        // Zëvendëso 'klase' me 'class' VETËM nëse NUK vjen pas 'leje ' ose 'konstante ' (p.sh. klase Personi {})
        kodiJS = kodiJS.replace(/(?<!(?:leje|konstante)\s+)\bklase\b/g, 'class');
        // Nëse ka mbetur ende ndonjë 'klase' (si variabël), e kthejmë në 'klase_var' në JS që të mos ketë konflikt me 'class' të sistemit
        kodiJS = kodiJS.replace(/\bklase\b/g, 'klase_var');

        // 4. Kthe ciklin for...of
        kodiJS = kodiJS.replace(/\bfor\s*\(([^)]+)\bte\b/g, (match) => match.replace(/\bte\b/, 'of'));

        // 5. Përkthe funksionet globale (shfaq -> console.log) direkt në kod
        for (const [shqip, js] of Object.entries(this.funksione)) {
            if (!js.startsWith('.')) {
                const regex = new RegExp(`\\b${shqip}\\b`, 'g');
                kodiJS = kodiJS.replace(regex, js);
            }
        }

        // 6. Përkthe metodat (.filtro -> .filter)
        for (const [shqip, js] of Object.entries(this.funksione)) {
            if (js.startsWith('.')) {
                const metodaJS = js.slice(1);
                const regex = new RegExp(`\\.${shqip}\\b`, 'g');
                kodiJS = kodiJS.replace(regex, `.${metodaJS}`);
            }
        }

        // 7. Kthe stringjet mbrapsht (tani template literals do të kthehen të sigurta)
        kodiJS = kodiJS.replace(/__TEKST_(\d+)__/g, (_, i) => stringet[parseInt(i)]);

        // 8. Pasi u kthyen stringjet, nëse brenda template literal ${...} ka mbetur 'klase', e bëjmë 'klase_var'
        kodiJS = kodiJS.replace(/\${([^}]+)}/g, (match, p1) => {
            return `\${${p1.replace(/\bklase\b/g, 'klase_var')}}`;
        });

        // 9. Nese kodi perdor funksione GUI, shto importin automatik te gui.js
        //    ne rreshtin e pare. Perdorim shteg ABSOLUT (bazuar te __dirname
        //    i ketij moduli, jo i skedarit te destinacionit) qe importi te
        //    funksionoje pavaresisht se ku ruhet skedari .js i perkthyer
        //    (p.sh. ne nje dosje krejt tjeter nga ajo e paketes eagle-script).
        const perdorGUI = FUNKSIONET_GUI.some((fn) => new RegExp(`\\b${fn}\\b`).test(kodiJS));
        if (perdorGUI) {
            const shtegulGui = path.join(__dirname, 'gui.js').replace(/\\/g, '/');
            const rreshtiImport =
                `const { ${FUNKSIONET_GUI.join(', ')} } = require('${shtegulGui}');\n`;
            kodiJS = rreshtiImport + kodiJS;
        }

        return kodiJS;
    }
}

// ─── Reverse Translator: JavaScript → Albanian ──────────────────────────────
class PerkthyesMbrapsht {
    constructor() {
        this.fjalorMbrapsht = {};
        for (const [shqip, js] of Object.entries(FJALOR)) {
            this.fjalorMbrapsht[js] = shqip;
        }

        this.funksioneMbrapsht = {};
        for (const [shqip, js] of Object.entries(FUNKSIONE_SHTESORE)) {
            this.funksioneMbrapsht[js] = shqip;
        }
    }

    perktheMbrapsht(kodiJS) {
        let kodiES = kodiJS;

        // Izolo stringjet
        const stringet = [];
        kodiES = kodiES.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, (match) => {
            const placeholder = `__JS_TEKST_${stringet.length}__`;
            stringet.push(match);
            return placeholder;
        });

        // Kthimi i operatorëve pa pasur nevojë për kufij fjalësh (\b) pasi === nuk është fjalë alfabetike
        kodiES = kodiES.replace(/===/g, 'eshte');
        kodiES = kodiES.replace(/!==/g, 'nuk_eshte');
        kodiES = kodiES.replace(/==/g, 'eshte');

        // Kthe metodat (.filter -> .filtro)
        for (const [js, shqip] of Object.entries(this.funksioneMbrapsht)) {
            if (js.startsWith('.')) {
                const metodaJS = js.slice(1);
                const regex = new RegExp(`\\.${metodaJS}\\b`, 'g');
                kodiES = kodiES.replace(regex, `.${shqip}`);
            }
        }

        // Kthe funksionet globale (console.log -> shfaq)
        const globaleSipasGjatesise = Object.entries(this.funksioneMbrapsht)
            .filter(([js]) => !js.startsWith('.'))
            .sort((a, b) => b[0].length - a[0].length);

        for (const [js, shqip] of globaleSipasGjatesise) {
            const eskapuarJS = js.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`\\b${eskapuarJS}\\b`, 'g');
            kodiES = kodiES.replace(regex, shqip);
        }

        // Kthe fjalët kyçe
        kodiES = kodiES.replace(/\belse\s+if\b/g, 'ndryshe_nese');

        const fjaletSipasGjatesise = Object.entries(this.fjalorMbrapsht)
            .filter(([js]) => js !== 'else if' && js !== '===' && js !== '!==')
            .sort((a, b) => b[0].length - a[0].length);

        for (const [js, shqip] of fjaletSipasGjatesise) {
            const regex = new RegExp(`\\b${js}\\b`, 'g');
            kodiES = kodiES.replace(regex, shqip);
        }

        // Kthe ciklin for...of
        kodiES = kodiES.replace(/\bfor\s*\(([^)]+)\bof\b/g, (match) => match.replace(/\bof\b/, 'te'));

        // Rikthe stringjet
        kodiES = kodiES.replace(/__JS_TEKST_(\d+)__/g, (_, i) => stringet[parseInt(i)]);

        return kodiES;
    }
}

// ─── Interpreter ─────────────────────────────────────────────────────────────
class EagleScriptInterpreter {
    constructor(opsione = {}) {
        this.perkthyes = new Perkthyes();
        this.perkthyesMbrapsht = new PerkthyesMbrapsht();
        this.debug = opsione.debug || false;
        this.shfaqPerkthimin = opsione.shfaqPerkthimin || false;
    }

    _libraria_standarde() {
        return `
const shfaq = (...args) => console.log(...args);
const paralajmero = (...args) => console.warn(...args);
const gabim_log = (...args) => console.error(...args);
const numroje = (v, baza) => parseInt(v, baza);
const numroje_dec = (v) => parseFloat(v);
const eshte_NaN = (v) => isNaN(v);
const shto_Math = (...a) => Math.max(...a);
const vogel_Math = (...a) => Math.min(...a);
const rrumbullakoset = (v) => Math.round(v);
const dyshja = (v) => Math.floor(v);
const tavani = (v) => Math.ceil(v);
const katrori = (v) => Math.sqrt(v);
const fuqia = (b, e) => Math.pow(b, e);
const rastesi = () => Math.random();
const abs_val = (v) => Math.abs(v);
const JSON_ne_tekst = (v, r, s) => JSON.stringify(v, r, s);
const tekst_ne_JSON = (v) => JSON.parse(v);
const celesat = (o) => Object.keys(o);
const vlerat_obj = (o) => Object.values(o);
const hyrjet = (o) => Object.entries(o);
const kopjo_obj = (...a) => Object.assign(...a);
const ngrij_obj = (o) => Object.freeze(o);
const prompt = (...args) => {
    if (typeof globalThis.prompt === 'function') {
        return globalThis.prompt(...args);
    }
    return '';
};
`;
    }

    ekzekuto(kodiBurim, opsione = {}) {
        try {
            const lexer = new Lexer(kodiBurim);
            lexer.tokenizo();
        } catch (e) {
            if (this.debug) console.error('[Lexer]', e.message);
        }

        const kodiJS = this.perkthyes.perkthe(kodiBurim);

        if (this.shfaqPerkthimin || this.debug) {
            console.log('─── Kodi i perkthyer (JavaScript) ───');
            console.log(kodiJS);
            console.log('─────────────────────────────────────');
        }

        try {
            const kodiPlote = this._libraria_standarde() + '\n' + kodiJS;
            const argv = opsione.argv || process.argv;
            const filePath = opsione.filePath || null;
            const cwd = opsione.cwd || process.cwd();
            const context = {
                console,
                process: { ...process, argv },
                setTimeout,
                setInterval,
                clearTimeout,
                clearInterval,
                Promise,
                Math,
                JSON,
                Object,
                Array,
                String,
                Number,
                Boolean,
                parseInt,
                parseFloat,
                isNaN,
                require,
                module,
                exports,
                __dirname: filePath ? path.dirname(filePath) : cwd,
                __filename: filePath ? path.resolve(filePath) : undefined,

                // ─── Funksionet e GUI-t (Eagle Script GUI mbi NodeGui/Qt) ───
                // Injektohen automatikisht ne cdo kontekst ekzekutimi, pa
                // pasur nevoje qe skripti .es te beje ndonje 'importo'.
                krijo_dritare: gui.krijo_dritare,
                buton_i_ri:    gui.buton_i_ri,
                tekst_i_ri:    gui.tekst_i_ri,
                fushe_teksti:  gui.fushe_teksti,
            };
            context.global = context;
            context.globalThis = context;
            vm.runInNewContext(kodiPlote, context, { filename: filePath || 'eagle-script' });
        } catch (gabim) {
            console.error('Gabim gjate ekzekutimit te Eagle Script:');
            this._format_gabim(gabim, kodiBurim, kodiJS);
        }
    }

    ktheNeEagleScript(kodiJS) {
        return this.perkthyesMbrapsht.perktheMbrapsht(kodiJS);
    }

    _format_gabim(gabim, burim, js) {
        const msg = gabim.message;
        const match = (gabim.stack || '').match(/\(eval[^)]*:(\d+):(\d+)\)/);
        if (match) {
            const rreshti = parseInt(match[1]) - this._libraria_standarde().split('\n').length;
            const kollona = parseInt(match[2]);
            const rreshtat = burim.split('\n');
            if (rreshtat[rreshti - 1]) {
                console.error(`  Rreshti ${rreshti}, Kollona ${kollona}: ${msg}`);
                console.error(`  ${rreshtat[rreshti - 1]}`);
                console.error(`  ${' '.repeat(kollona - 1)}^`);
                return;
            }
        }
        console.error(' ', msg);
    }
}

module.exports = { EagleScriptInterpreter, Perkthyes, FJALOR, FUNKSIONE_SHTESORE };