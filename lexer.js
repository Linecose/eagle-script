// lexer.js - Eagle Script Lexer
// All keywords use ASCII-only Albanian (no special chars: e, c instead of e-umlaut, c-cedilla)

const TokenType = {
    // Literals
    NUMER:      'NUMER',        // 42, 3.14
    TEKST:      'TEKST',        // "hello"
    BOOLEAN:    'BOOLEAN',      // vertete / gabim
    NULL:       'NULL',         // asnje

    // Identifiers & keywords
    FJALE_KYCE: 'FJALE_KYCE',
    IDENTIFIER: 'IDENTIFIER',

    // Arithmetic
    PLUS:       'PLUS',         // +
    MINUS:      'MINUS',        // -
    HERË:       'HERE',         // *
    PJESE:      'PJESE',        // /
    MBETJE:     'MBETJE',       // %
    FUQI:       'FUQI',         // **

    // Comparison
    BARABAR:    'BARABAR',      // ==
    JO_BARABAR: 'JO_BARABAR',  // !=
    ME_MADH:    'ME_MADH',      // >
    ME_VOGEL:   'ME_VOGEL',     // <
    MADH_BARAB: 'MADH_BARAB',  // >=
    VOGEL_BARAB:'VOGEL_BARAB', // <=

    // Logical
    DHE:        'DHE',          // &&
    OSE:        'OSE',          // ||
    JO:         'JO',           // !

    // Assignment
    BARAZIM:    'BARAZIM',      // =
    PLUS_BAR:   'PLUS_BAR',    // +=
    MINUS_BAR:  'MINUS_BAR',   // -=
    SHUMICA:    'SHUMICA',     // *=
    PJESE_BAR:  'PJESE_BAR',   // /=

    // Delimiters
    KLLAPEZ_H:  'KLLAPEZ_H',   // (
    KLLAPEZ_M:  'KLLAPEZ_M',   // )
    GREP_H:     'GREP_H',      // {
    GREP_M:     'GREP_M',      // }
    KATRORE_H:  'KATRORE_H',   // [
    KATRORE_M:  'KATRORE_M',   // ]
    PRESJE:     'PRESJE',      // ,
    PIKA_PRE:   'PIKA_PRE',    // ;
    PIKA:       'PIKA',        // .
    DYPIKET:    'DYPIKET',     // :

    // Special
    EOF:        'EOF',
    GABIM:      'GABIM'
};

// All Eagle Script keywords (ASCII-only Albanian)
const KEYWORDS = new Set([
    'shfaq',        // print / console.log
    'leje',         // let
    'konstante',    // const
    'nese',         // if
    'ndryshe_nese', // else if
    'ndryshe',      // else
    'per',          // for
    'ndersa',       // while
    'bej',          // do (do-while)
    'funksion',     // function
    'kthe',         // return
    'klase',        // class
    'i_ri',         // new
    'fshi',         // delete
    'ne',           // in
    'te',           // of (for...of)
    'provo',        // try
    'kap',          // catch
    'perfundimisht',// finally
    'hedh',         // throw
    'ndalo',        // break
    'vazhdo',       // continue
    'eksporto',     // export
    'importo',      // import
    'shto',         // push (array method alias)
    'gjatesia',     // length (property alias)
    'vertete',      // true
    'gabim_val',    // false
    'asnje',        // null
    'i_papercaktuar', // undefined
    'lloji',        // typeof
    'instanceof_al', // instanceof
    'eshte',        // === (strict equal keyword alternative)
    'nuk_eshte',    // !== (strict not-equal keyword alternative)
]);

class Lexer {
    constructor(kodi) {
        this.kodi = kodi;
        this.pozicioni = 0;
        this.rreshti = 1;
        this.kollona = 1;
        this.tokens = [];
    }

    karakter() {
        return this.kodi[this.pozicioni] || '';
    }

    shiko_perpara(offset = 1) {
        return this.kodi[this.pozicioni + offset] || '';
    }

    avanco() {
        if (this.kodi[this.pozicioni] === '\n') {
            this.rreshti++;
            this.kollona = 1;
        } else {
            this.kollona++;
        }
        return this.kodi[this.pozicioni++];
    }

    pozicioni_aktual() {
        return { rreshti: this.rreshti, kollona: this.kollona };
    }

    kalo_hapesira() {
        while (this.pozicioni < this.kodi.length && /\s/.test(this.karakter())) {
            this.avanco();
        }
    }

    kalo_koment() {
        // Single-line comment: # or //
        if (this.karakter() === '#' ||
            (this.karakter() === '/' && this.shiko_perpara() === '/')) {
            while (this.pozicioni < this.kodi.length && this.karakter() !== '\n') {
                this.avanco();
            }
            return true;
        }
        // Multi-line comment: /* ... */
        if (this.karakter() === '/' && this.shiko_perpara() === '*') {
            this.avanco(); this.avanco();
            while (this.pozicioni < this.kodi.length) {
                if (this.karakter() === '*' && this.shiko_perpara() === '/') {
                    this.avanco(); this.avanco();
                    break;
                }
                this.avanco();
            }
            return true;
        }
        return false;
    }

    lexo_numer() {
        let vlera = '';
        const poz = this.pozicioni_aktual();
        while (this.pozicioni < this.kodi.length && /[0-9]/.test(this.karakter())) {
            vlera += this.avanco();
        }
        if (this.karakter() === '.' && /[0-9]/.test(this.shiko_perpara())) {
            vlera += this.avanco();
            while (this.pozicioni < this.kodi.length && /[0-9]/.test(this.karakter())) {
                vlera += this.avanco();
            }
        }
        return { type: TokenType.NUMER, value: parseFloat(vlera), ...poz };
    }

    lexo_tekst(kuotimi) {
        const poz = this.pozicioni_aktual();
        this.avanco(); // skip opening quote
        let vlera = '';
        while (this.pozicioni < this.kodi.length && this.karakter() !== kuotimi) {
            if (this.karakter() === '\\') {
                this.avanco();
                const esc = this.avanco();
                const eskapet = { 'n': '\n', 't': '\t', 'r': '\r', '\\': '\\', '"': '"', "'": "'" };
                vlera += eskapet[esc] || esc;
            } else {
                vlera += this.avanco();
            }
        }
        this.avanco(); // skip closing quote
        return { type: TokenType.TEKST, value: vlera, ...poz };
    }

    lexo_fjale() {
        const poz = this.pozicioni_aktual();
        let fjala = '';
        while (this.pozicioni < this.kodi.length && /[a-zA-Z0-9_]/.test(this.karakter())) {
            fjala += this.avanco();
        }
        if (fjala === 'vertete') return { type: TokenType.BOOLEAN, value: true, ...poz };
        if (fjala === 'gabim_val') return { type: TokenType.BOOLEAN, value: false, ...poz };
        if (fjala === 'asnje') return { type: TokenType.NULL, value: null, ...poz };
        if (KEYWORDS.has(fjala)) return { type: TokenType.FJALE_KYCE, value: fjala, ...poz };
        return { type: TokenType.IDENTIFIER, value: fjala, ...poz };
    }

    tokenizo() {
        while (this.pozicioni < this.kodi.length) {
            this.kalo_hapesira();
            if (this.pozicioni >= this.kodi.length) break;
            if (this.kalo_koment()) continue;

            const poz = this.pozicioni_aktual();
            const k = this.karakter();
            const k2 = this.shiko_perpara();

            // Numbers
            if (/[0-9]/.test(k)) { this.tokens.push(this.lexo_numer()); continue; }

            // Strings
            if (k === '"' || k === "'") { this.tokens.push(this.lexo_tekst(k)); continue; }

            // Template strings (backtick)
            if (k === '`') { this.tokens.push(this.lexo_tekst('`')); continue; }

            // Words / keywords
            if (/[a-zA-Z_]/.test(k)) { this.tokens.push(this.lexo_fjale()); continue; }

            // Two-char operators
            if (k === '*' && k2 === '*') { this.avanco(); this.avanco(); this.tokens.push({ type: TokenType.FUQI, value: '**', ...poz }); continue; }
            if (k === '=' && k2 === '=') { this.avanco(); this.avanco(); this.tokens.push({ type: TokenType.BARABAR, value: '==', ...poz }); continue; }
            if (k === '!' && k2 === '=') { this.avanco(); this.avanco(); this.tokens.push({ type: TokenType.JO_BARABAR, value: '!=', ...poz }); continue; }
            if (k === '>' && k2 === '=') { this.avanco(); this.avanco(); this.tokens.push({ type: TokenType.MADH_BARAB, value: '>=', ...poz }); continue; }
            if (k === '<' && k2 === '=') { this.avanco(); this.avanco(); this.tokens.push({ type: TokenType.VOGEL_BARAB, value: '<=', ...poz }); continue; }
            if (k === '&' && k2 === '&') { this.avanco(); this.avanco(); this.tokens.push({ type: TokenType.DHE, value: '&&', ...poz }); continue; }
            if (k === '|' && k2 === '|') { this.avanco(); this.avanco(); this.tokens.push({ type: TokenType.OSE, value: '||', ...poz }); continue; }
            if (k === '+' && k2 === '=') { this.avanco(); this.avanco(); this.tokens.push({ type: TokenType.PLUS_BAR, value: '+=', ...poz }); continue; }
            if (k === '-' && k2 === '=') { this.avanco(); this.avanco(); this.tokens.push({ type: TokenType.MINUS_BAR, value: '-=', ...poz }); continue; }
            if (k === '*' && k2 === '=') { this.avanco(); this.avanco(); this.tokens.push({ type: TokenType.SHUMICA, value: '*=', ...poz }); continue; }
            if (k === '/' && k2 === '=') { this.avanco(); this.avanco(); this.tokens.push({ type: TokenType.PJESE_BAR, value: '/=', ...poz }); continue; }
            if (k === '+' && k2 === '+') { this.avanco(); this.avanco(); this.tokens.push({ type: TokenType.IDENTIFIER, value: '++', ...poz }); continue; }
            if (k === '-' && k2 === '-') { this.avanco(); this.avanco(); this.tokens.push({ type: TokenType.IDENTIFIER, value: '--', ...poz }); continue; }

            // Single-char operators & delimiters
            const single = {
                '+': TokenType.PLUS, '-': TokenType.MINUS,
                '*': TokenType.HERE, '/': TokenType.PJESE,
                '%': TokenType.MBETJE, '=': TokenType.BARAZIM,
                '>': TokenType.ME_MADH, '<': TokenType.ME_VOGEL,
                '!': TokenType.JO,
                '(': TokenType.KLLAPEZ_H, ')': TokenType.KLLAPEZ_M,
                '{': TokenType.GREP_H, '}': TokenType.GREP_M,
                '[': TokenType.KATRORE_H, ']': TokenType.KATRORE_M,
                ',': TokenType.PRESJE, ';': TokenType.PIKA_PRE,
                '.': TokenType.PIKA, ':': TokenType.DYPIKET
            };
            if (single[k]) {
                this.avanco();
                this.tokens.push({ type: single[k], value: k, ...poz });
                continue;
            }

            // Unknown
            this.tokens.push({ type: TokenType.GABIM, value: k, ...poz });
            this.avanco();
        }
        this.tokens.push({ type: TokenType.EOF, value: null, rreshti: this.rreshti, kollona: this.kollona });
        return this.tokens;
    }
}

module.exports = { Lexer, TokenType, KEYWORDS };
