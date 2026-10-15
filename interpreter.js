// interpreter.js - Eagle Script Interpreter
//
// Perkthimi Eagle Script <-> JavaScript ndodh te perkthyes.js (skaner i vertete).
// Ky skedar ekzekuton kodin e perkthyer ne nje kontekst 'vm' dhe formaton gabimet.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createRequire } = require('module');
const { Lexer } = require('./lexer');
const gui = require('./gui'); // NodeGui ngarkohet vone, vetem kur perdoret nje funksion GUI
const { Perkthyes, PerkthyesMbrapsht } = require('./perkthyes');

// Lexim sinkron nga stdin per lexo(...): shfaq pyetjen dhe kthen rreshtin e shtypur.
function lexoRresht(pyetja) {
    if (pyetja !== undefined) process.stdout.write(String(pyetja));
    const buf = Buffer.alloc(1);
    let rreshti = '';
    for (;;) {
        let lexuar = 0;
        try {
            lexuar = fs.readSync(0, buf, 0, 1, null);
        } catch (e) {
            if (e.code === 'EAGAIN') continue;
            if (e.code === 'EOF') break;
            throw e;
        }
        if (lexuar === 0) break;               // fundi i hyrjes
        const ch = buf.toString('utf8');
        if (ch === '\n') break;
        rreshti += ch;
    }
    return rreshti.replace(/\r$/, '');
}

class EagleScriptInterpreter {
    constructor(opsione = {}) {
        this.perkthyes = new Perkthyes();
        this.perkthyesMbrapsht = new PerkthyesMbrapsht();
        this.debug = opsione.debug || false;
        this.shfaqPerkthimin = opsione.shfaqPerkthimin || false;
    }

    ekzekuto(kodiBurim, opsione = {}) {
        // Lexeri sherben vetem per diagnostikim (me --debug); nuk bllokon ekzekutimin.
        if (this.debug) {
            try {
                const lexer = new Lexer(kodiBurim);
                const tokens = lexer.tokenizo();
                for (const t of tokens) {
                    if (t.type === 'GABIM') console.error(`[Lexer] Karakter i panjohur '${t.value}' ne rreshtin ${t.rreshti}`);
                }
            } catch (e) {
                console.error('[Lexer]', e.message);
            }
        }

        const kodiJS = this.perkthyes.perkthe(kodiBurim);

        if (this.shfaqPerkthimin || this.debug) {
            console.log('─── Kodi i perkthyer (JavaScript) ───');
            console.log(kodiJS);
            console.log('─────────────────────────────────────');
        }

        const filePath = opsione.filePath || null;
        const emriSkedarit = filePath ? path.resolve(filePath) : 'eagle-script.es';
        const argv = opsione.argv || process.argv;
        const cwd = opsione.cwd || process.cwd();

        const context = {
            console,
            process: { ...process, argv },
            setTimeout, setInterval, clearTimeout, clearInterval,
            setImmediate, clearImmediate, queueMicrotask,
            Buffer, URL, URLSearchParams, TextEncoder, TextDecoder,
            require, module, exports,
            prompt: lexoRresht,
            __dirname: filePath ? path.dirname(filePath) : cwd,
            __filename: filePath ? path.resolve(filePath) : undefined,
        };
        // Funksionet GUI injektohen automatikisht (pa 'importo').
        for (const emri of gui.EMRAT_GUI) context[emri] = gui[emri];
        context.global = context;
        context.globalThis = context;
        vm.createContext(context);

        // Regjistri per perfshi(): burimet (per gabime) dhe modulet e ngarkuara (cache).
        this._kontekst = context;
        this._burimet = new Map([[emriSkedarit, kodiBurim]]);
        this._modulet = new Map();
        context.perfshi = this._krijoPerfshi(filePath ? path.dirname(emriSkedarit) : cwd);

        // Kodi i perkthyer ka NJE-ME-NJE rreshtat e burimit, ndaj numrat e rreshtave
        // ne gabime jane te sakte.
        try {
            const skripti = new vm.Script(kodiJS, { filename: emriSkedarit });
            skripti.runInContext(context);
        } catch (gabim) {
            console.error('Gabim gjate ekzekutimit te Eagle Script:');
            this._format_gabim(gabim, emriSkedarit);
            process.exitCode = 1;
        }
    }

    // perfshi("./te_dhenat.es")  -> ngarkon nje skedar .es tjeter si modul dhe kthen
    //                               ate qe ai vendos ne module.exports (me cache).
    // perfshi("zlib")             -> ngarkon nje modul Node / npm (kerkohet nga dosja e skedarit).
    _krijoPerfshi(dosja) {
        return (rruga) => {
            const eshteRrugeLokale = rruga.startsWith('.') || path.isAbsolute(rruga);
            if (!eshteRrugeLokale) return createRequire(path.join(dosja, 'eagle.js'))(rruga);
            let abs = path.resolve(dosja, rruga);
            if (!path.extname(abs)) abs += '.es';
            return this._ngarkoModul(abs);
        };
    }

    _ngarkoModul(abs) {
        if (this._modulet.has(abs)) return this._modulet.get(abs).exports;
        const burim = fs.readFileSync(abs, 'utf-8');
        this._burimet.set(abs, burim);
        const kodiJS = this.perkthyes.perkthe(burim);
        const mod = { exports: {} };
        this._modulet.set(abs, mod);          // para ekzekutimit: lejon varesi rrethore
        // Mbeshtjellesi qendron ne rreshtin e pare, qe numrat e rreshtave te mos zhvendosen.
        const mbeshtjelles = '(function (module, exports, perfshi, __dirname, __filename) { ' + kodiJS + '\n})';
        const fn = new vm.Script(mbeshtjelles, { filename: abs }).runInContext(this._kontekst);
        const dosja = path.dirname(abs);
        fn.call(mod.exports, mod, mod.exports, this._krijoPerfshi(dosja), dosja, abs);
        return mod.exports;
    }

    ktheNeEagleScript(kodiJS) {
        return this.perkthyesMbrapsht.perktheMbrapsht(kodiJS);
    }

    // Gjen ne stack-un e gabimit skedarin .es (kryesor ose te perfshire) dhe rreshtin.
    _format_gabim(gabim, emriKryesor) {
        const mesazhi = gabim && gabim.message ? gabim.message : String(gabim);
        const stack = (gabim && gabim.stack) || '';

        let gjetur = null;       // { skedari, rreshti, pozicioni }
        for (const skedari of this._burimet.keys()) {
            const re = new RegExp(skedari.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':(\\d+)');
            const m = re.exec(stack);
            if (m && (gjetur === null || m.index < gjetur.pozicioni)) {
                gjetur = { skedari, rreshti: parseInt(m[1], 10), pozicioni: m.index };
            }
        }

        const rreshtat = gjetur ? this._burimet.get(gjetur.skedari).split('\n') : [];
        if (gjetur && rreshtat[gjetur.rreshti - 1] !== undefined) {
            const kuAshte = gjetur.skedari === emriKryesor
                ? ''
                : ` (${path.relative(path.dirname(emriKryesor), gjetur.skedari)})`;
            console.error(`  Rreshti ${gjetur.rreshti}${kuAshte}: ${mesazhi}`);
            console.error(`  ${rreshtat[gjetur.rreshti - 1].trim()}`);
        } else {
            console.error(' ', mesazhi);
        }
    }
}

module.exports = { EagleScriptInterpreter, Perkthyes, PerkthyesMbrapsht };
