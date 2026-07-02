# Eagle Script

**Gjuha e parë e programimit në shqip** — një transpiler/interpretues i ndërtuar mbi Node.js, që përkthen kod shqip në JavaScript dhe e ekzekuton, me mbështetje edhe për ndërfaqe grafike (GUI) desktop përmes NodeGui/Qt.

- **Version:** 1.0.0
- **Autor:** Geri
- **Licenca:** MIT
- **Kërkesa:** Node.js `>= 14.0.0`

---

## Përmbajtja

1. [Instalimi](#instalimi)
2. [Përdorimi (CLI)](#përdorimi-cli)
3. [Sintaksa bazë](#sintaksa-bazë)
4. [Fjalët kyçe](#fjalët-kyçe)
5. [Funksionet e integruara](#funksionet-e-integruara)
6. [Ndërfaqja grafike (GUI)](#ndërfaqja-grafike-gui)
7. [Shembuj të plotë](#shembuj-të-plotë)
8. [Struktura e projektit](#struktura-e-projektit)
9. [Kufizime dhe shënime teknike](#kufizime-dhe-shënime-teknike)

---

## Instalimi

```bash
npm install -g eagle-script
```

Ose brenda një projekti:

```bash
npm install eagle-script
```

Për të përdorur GUI-n (dritare, butona, etj.), duhet instaluar edhe NodeGui:

```bash
npm install @nodegui/nodegui
```

---

## Përdorimi (CLI)

```bash
eagle <skedari.es> [opsione]     # Ekzekuton kodin shqip
eagle <skedari.es> --perkthe     # Ekzekuton DHE ruan automatikisht skedarin .js
eagle <skedari.js>               # E kthen kodin JavaScript standard në Eagle Script (.es)
```

### Opsionet

| Flamuri | Shkurtim | Përshkrimi |
|---|---|---|
| `--perkthe` | `-p` | Shfaq dhe ruan kodin e përkthyer në JavaScript (`.js`) |
| `--debug` | `-d` | Aktivizon modalitetin e debug-ut (shfaq gjithmonë kodin e përkthyer + gabimet e lexer-it) |
| `--versioni` | `--version` | Shfaq versionin e Eagle Script |
| `--ndihme` | `--help` | Shfaq mesazhin e ndihmës |

### Zbulimi automatik CLI vs GUI

Nuk ka nevojë të specifikosh nëse skripti yt është një program CLI apo një aplikacion me dritare. `eagle` e skanon vetë skedarin `.es`:

- Nëse gjen thirrje të `krijo_dritare`, `buton_i_ri`, `tekst_i_ri` ose `fushe_teksti`, e rinis automatikisht ekzekutimin përmes `qode` (binari i posaçëm i NodeGui, i domosdoshëm për event loop-in e Qt-it).
- Përndryshe, e ekzekuton normalisht me `node`.

> **Kujdes:** Mos i emërto skriptet e tua `gui.es`, `index.es`, `interpreter.es` ose `lexer.es` — `--perkthe` do të prodhonte një skedar `.js` me të njëjtin emër si një skedar themelor i vetë paketës Eagle Script, dhe ruajtja bllokohet automatikisht për t'i mbrojtur këto skedarë.

---

## Sintaksa bazë

```
# Ky është një koment (edhe // funksionon)

leje emri = "Geri"          # deklarim variabli (let)
konstante PI = 3.14159      # deklarim konstante (const)

nese (emri === "Geri") {    # if
    shfaq("Përshëndetje, " + emri)
}
ndryshe_nese (emri === "Ana") {  # else if
    shfaq("Tjetër person")
}
ndryshe {                   # else
    shfaq("I panjohur")
}

per (leje i = 0; i < 5; i = i + 1) {   # for
    shfaq(i)
}

leje gjilpera = [1, 2, 3]
per (leje x te gjilpera) {  # for...of
    shfaq(x)
}

funksion pershendetje(emri) {   # function
    kthe "Përshëndetje, " + emri + "!"  # return
}

klase Person {               # class
    konstruktor(emer) {
        kete.emer = emer
    }
}

leje p = i_ri Person("Geri")  # new

provo {                       # try
    hedh i_ri Error("gabim")  # throw
} kap (gabim) {               # catch
    gabim_log(gabim.message)
} perfundimisht {             # finally
    shfaq("mbaroi")
}
```

---

## Fjalët kyçe

| Shqip | JavaScript | Shqip | JavaScript |
|---|---|---|---|
| `leje` | `let` | `provo` | `try` |
| `konstante` | `const` | `kap` | `catch` |
| `nese` | `if` | `perfundimisht` | `finally` |
| `ndryshe_nese` | `else if` | `hedh` | `throw` |
| `ndryshe` | `else` | `eksporto` | `export` |
| `per` | `for` | `importo` | `import` |
| `ndersa` | `while` | `vertete` | `true` |
| `bej` | `do` | `gabim_val` | `false` |
| `ndalo` | `break` | `asnje` | `null` |
| `vazhdo` | `continue` | `i_papercaktuar` | `undefined` |
| `kthe` | `return` | `eshte` | `===` |
| `funksion` | `function` | `nuk_eshte` | `!==` |
| `klase` | `class` | `instanceof_al` | `instanceof` |
| `i_ri` | `new` | `fshi` | `delete` |
| `ne` | `in` | `te` | `of` (vetëm brenda `per (... te ...)`) |

---

## Funksionet e integruara

Këto injektohen automatikisht — nuk kërkojnë asnjë `importo`:

### Konsolë
| Shqip | JavaScript |
|---|---|
| `shfaq(...)` | `console.log(...)` |
| `paralajmero(...)` | `console.warn(...)` |
| `gabim_log(...)` | `console.error(...)` |

### Numra dhe Matematikë
| Shqip | JavaScript |
|---|---|
| `numroje(v, baza)` | `parseInt(v, baza)` |
| `numroje_dec(v)` | `parseFloat(v)` |
| `eshte_NaN(v)` | `isNaN(v)` |
| `shto_Math(...a)` | `Math.max(...a)` |
| `vogel_Math(...a)` | `Math.min(...a)` |
| `rrumbullakoset(v)` | `Math.round(v)` |
| `dyshja(v)` | `Math.floor(v)` |
| `tavani(v)` | `Math.ceil(v)` |
| `katrori(v)` | `Math.sqrt(v)` |
| `fuqia(b, e)` | `Math.pow(b, e)` |
| `rastesi()` | `Math.random()` |
| `abs_val(v)` | `Math.abs(v)` |

### JSON dhe Objekte
| Shqip | JavaScript |
|---|---|
| `JSON_ne_tekst(v)` | `JSON.stringify(v)` |
| `tekst_ne_JSON(v)` | `JSON.parse(v)` |
| `celesat(o)` | `Object.keys(o)` |
| `vlerat_obj(o)` | `Object.values(o)` |
| `hyrjet(o)` | `Object.entries(o)` |
| `kopjo_obj(...a)` | `Object.assign(...a)` |
| `ngrij_obj(o)` | `Object.freeze(o)` |

### Metoda vargjesh/stringjesh (përdoren me pikë: `.metoda()`)
| Shqip | JavaScript |
|---|---|
| `.gjatesia` | `.length` |
| `.ShtoNe(...)` | `.push(...)` |
| `.HeqNga()` | `.pop()` |
| `.HeqFill()` | `.shift()` |
| `.ShtoFill(...)` | `.unshift(...)` |
| `.bashko(sep)` | `.join(sep)` |
| `.ndaj(sep)` | `.split(sep)` |
| `.prerje(a, b)` | `.slice(a, b)` |
| `.gjej(v)` | `.indexOf(v)` |
| `.filtro(fn)` | `.filter(fn)` |
| `.harton(fn)` | `.map(fn)` |
| `.zvoglo(fn)` | `.reduce(fn)` |
| `.per_secilin(fn)` | `.forEach(fn)` |
| `.rendito(fn)` | `.sort(fn)` |
| `.anasjelltas()` | `.reverse()` |
| `.perfshin(v)` | `.includes(v)` |
| `.bashkoje(v)` | `.concat(v)` |
| `.stringjeso()` | `.toString()` |

### Të tjera
| Shqip | JavaScript |
|---|---|
| `llojiOf` | `typeof` |
| `Varg` | `Array` |
| `Objekt` | `Object` |
| `Shuma` | `Number` |
| `Tekst` | `String` |
| `Boolean_al` | `Boolean` |
| `prit(fn, ms)` | `setTimeout(fn, ms)` |
| `prit_interval(fn, ms)` | `setInterval(fn, ms)` |
| `anulo_prit(id)` | `clearTimeout(id)` |
| `anulo_interval(id)` | `clearInterval(id)` |
| `premtim` | `Promise` |
| `async_al` | `async` |
| `prite` | `await` |
| `lexo(...)` | `prompt(...)` |

---

## Ndërfaqja grafike (GUI)

Eagle Script ofron krijim aplikacionesh desktop me Qt përmes NodeGui, me API krejtësisht shqip. **Nuk kërkohet asnjë import** — `eagle` i zbulon vetë dhe rinis ekzekutimin me `qode` automatikisht (shih [Zbulimi automatik](#zbulimi-automatik-cli-vs-gui)).

### Funksionet krijuese

| Funksioni | Përshkrimi |
|---|---|
| `krijo_dritare(titulli, gjeresia, lartesia)` | Krijon dritaren kryesore të aplikacionit |
| `buton_i_ri(tekst)` | Krijon një buton |
| `tekst_i_ri(permbajtja)` | Krijon një etiketë teksti (label) |
| `fushe_teksti(placeholder)` | Krijon një fushë hyrëse teksti (input) |

### Metodat e dritares

| Metoda | Përshkrimi |
|---|---|
| `.shto(element)` | Shton elementin, i vendosur automatikisht në rreshtin tjetër të lirë (grid me 1 kolonë) |
| `.shto(element, rreshti, kolona, rreshtaShtrire, kolonaShtrire)` | Vendos elementin në një pozicion të saktë të grid-it (p.sh. për tastierë kalkulatori) |
| `.shfaqe()` | E shfaq dritaren |
| `.mbylle()` | E mbyll dritaren |
| `.vendos_titull(tekst)` | Ndryshon titullin e dritares |
| `.vendos_stil(css)` | Aplikon stil CSS (Qt style sheet) |
| `.vendos_madhesi(gjeresia, lartesia)` | Ndryshon përmasat e dritares |
| `.kur_shtypet(funksioni)` | Regjistron një event dëgjues për shtypje tastiere |

### Metodat e butonit

| Metoda | Përshkrimi |
|---|---|
| `.kur_klikohet(funksioni)` | Ekzekuton `funksioni` kur klikohet |
| `.vendos_tekst(tekst)` | Ndryshon tekstin e butonit |
| `.vendos_stil(css)` | Aplikon stil CSS |
| `.vendos_madhesi(gjeresia, lartesia)` | Ndryshon përmasat minimale |
| `.vendos_focus()` | I jep fokusin butonit |
| `.kur_shtypet(funksioni)` | Event dëgjues për tastierë |

### Metodat e etiketës (tekst_i_ri)

| Metoda | Përshkrimi |
|---|---|
| `.vendos_tekst(tekst)` | Ndryshon tekstin |
| `.vendos_stil(css)` | Aplikon stil CSS |
| `.vendos_madhesi(gjeresia, lartesia)` | Ndryshon përmasat minimale |

### Metodat e fushës së tekstit (fushe_teksti)

| Metoda | Përshkrimi |
|---|---|
| `.merr_vleren()` | Kthen vlerën aktuale të fushës |
| `.vendos_vleren(v)` | Vendos një vlerë të re |
| `.kur_ndryshon(funksioni)` | Event dëgjues kur ndryshon teksti |
| `.beje_read_only(vertete/gabim_val)` | E bën fushën vetëm-për-lexim |
| `.vendos_stil(css)` | Aplikon stil CSS |
| `.vendos_madhesi(gjeresia, lartesia)` | Ndryshon përmasat minimale |

### Shembull i thjeshtë (numërues)

```
leje numri = 0

leje dritarja = krijo_dritare("Numeruesi im", 300, 150)
leje eticheta = tekst_i_ri("Numri: 0")
leje butoni = buton_i_ri("Shto 1")

butoni.kur_klikohet(funksion() {
    numri = numri + 1
    eticheta.vendos_tekst("Numri: " + numri)
})

dritarja.shto(eticheta)
dritarja.shto(butoni)
dritarja.shfaqe()
```

---

## Shembuj të plotë

### Program CLI i thjeshtë

```
leje numrat = [4, 8, 15, 16, 23, 42]
leje shuma = numrat.zvoglo(funksion(a, b) { kthe a + b })

shfaq("Shuma është: " + shuma)
shfaq("Numrat çift: " + JSON_ne_tekst(numrat.filtro(funksion(n) { kthe n % 2 === 0 })))
```

### Klasë me trashëgimi

```
klase Kafshe {
    konstruktor(emer) {
        kete.emer = emer
    }
    bej_zhurme() {
        shfaq(kete.emer + " ben nje zhurme")
    }
}

klase Qen ndryshon Kafshe {
    bej_zhurme() {
        shfaq(kete.emer + " leh: Ham!")
    }
}

leje q = i_ri Qen("Rex")
q.bej_zhurme()
```

---

## Struktura e projektit

```
eagle-script/
├── index.js          # Pika hyrëse e CLI-t; parsim flamurësh, zbulim CLI/GUI, lexim/ruajtje skedarësh
├── interpreter.js     # Përkthyesi Shqip → JS (dhe anasjelltas) + ekzekutuesi (vm)
├── lexer.js           # Tokenizuesi (validim sintakse)
├── gui.js              # Wrapper-i shqip mbi @nodegui/nodegui (Qt)
├── package.json
└── teste/              # Skriptet .es të testimit
```

> Këta katër skedarë (`index.js`, `interpreter.js`, `lexer.js`, `gui.js`) janë **të rezervuar**: `eagle` refuzon ta ruajë ndonjë skedar të përkthyer që do t'i mbishkruante.

---

## Kufizime dhe shënime teknike

- **Skriptet GUI kërkojnë `qode`**, jo `node` — NodeGui përdor një fork të Node-it (`qode`) që bashkon event loop-in e Qt-it me atë të Node.js. `eagle` e zbulon dhe e rinis vetë automatikisht kur nevojitet; instalo NodeGui me `npm install @nodegui/nodegui`.
- **Ekzekutimi normal** (skriptet pa GUI) përdor modulin `vm` të Node-it (`vm.runInNewContext`) — kodi ekzekutohet në një kontekst të izoluar, jo direkt në procesin kryesor.
- **`--perkthe`** ruan gjithashtu një skedar `.js` të pavarur; nëse skripti përdor GUI, në rreshtin e parë të atij skedari shtohet automatikisht `require(...)` drejt `gui.js` (me shteg absolut, që të funksionojë pavarësisht ku ruhet skedari).
- Emri i skedarëve `.es` **nuk duhet të përplaset** me `index.js`, `interpreter.js`, `lexer.js` ose `gui.js`.
- Komentet mbështeten me `#` ose `//` (rresht i vetëm) dhe `/* ... */` (shumë-rreshtësh, vetëm në lexer).
