# Eagle Script

<<<<<<< HEAD
**Gjuha e parë e programimit në shqip** — një transpiler/interpretues i ndërtuar mbi Node.js, që përkthen kod shqip në JavaScript dhe e ekzekuton, me mbështetje edhe për ndërfaqe grafike desktop përmes Qt dhe addon-it native EagleGUI.

- **Version:** 2.0.0
- **Autor:** Geri
=======
**Gjuha e parë e programimit në shqip** — një transpiler/interpretues i ndërtuar mbi Node.js, që përkthen kod shqip në JavaScript dhe e ekzekuton, me mbështetje edhe për ndërfaqe grafike (GUI) desktop përmes NodeGui/Qt.

- **Version:** 1.0.0
- **Autor:** Gerjon Shkurti
>>>>>>> b51f9f42e105c6bb473c4d7f285996426711d7eb
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

<<<<<<< HEAD
GUI përdor addon-in Qt te dosja `eaglegui` (nuk ka nevojë për `qode` ose NodeGui). Nëse moduli native nuk është ndërtuar në makinën tënde:

```bash
cd eaglegui
npm install
npm run nderto
```

Kërkohen Node.js 18+, Qt 6, CMake dhe një përpilues C++17. Udhëzimet e plota gjenden te [`eaglegui/README.md`](./eaglegui/README.md).

=======
Për të përdorur GUI-n (dritare, butona, etj.), duhet instaluar edhe NodeGui:

```bash
npm install @nodegui/nodegui
```

>>>>>>> b51f9f42e105c6bb473c4d7f285996426711d7eb
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

<<<<<<< HEAD
### Ekzekutimi CLI dhe GUI

Të dy llojet e skripteve ekzekutohen me Node. Moduli native Qt ngarkohet vetëm kur thirret funksioni i parë grafik; dritarja e parë nis vetë ciklin e ngjarjeve. Për shembull, ekzekuto `node index.js shembuj/biblioteka.es`. Nëse addon-i nuk është ndërtuar, ndiq udhëzimet te `eaglegui/README.md`.
=======
### Zbulimi automatik CLI vs GUI

Nuk ka nevojë të specifikosh nëse skripti yt është një program CLI apo një aplikacion me dritare. `eagle` e skanon vetë skedarin `.es`:

- Nëse gjen thirrje të `krijo_dritare`, `buton_i_ri`, `tekst_i_ri` ose `fushe_teksti`, e rinis automatikisht ekzekutimin përmes `qode` (binari i posaçëm i NodeGui, i domosdoshëm për event loop-in e Qt-it).
- Përndryshe, e ekzekuton normalisht me `node`.
>>>>>>> b51f9f42e105c6bb473c4d7f285996426711d7eb

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
<<<<<<< HEAD
| `kete` | `this` | `konstruktor` | `constructor` |
| `ndryshon` | `extends` | `prindi` | `super` |
| `statik` | `static` | `nderro` | `switch` |
| `rasti` | `case` | `paracaktuar` | `default` |
=======
>>>>>>> b51f9f42e105c6bb473c4d7f285996426711d7eb

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

<<<<<<< HEAD
Eagle Script ofron krijim aplikacionesh desktop me Qt përmes addon-it native EagleGUI, me API krejtësisht shqip. **Nuk kërkohet asnjë import** — funksionet grafike injektohen automatikisht dhe aplikacioni ekzekutohet direkt me Node.
=======
Eagle Script ofron krijim aplikacionesh desktop me Qt përmes NodeGui, me API krejtësisht shqip. **Nuk kërkohet asnjë import** — `eagle` i zbulon vetë dhe rinis ekzekutimin me `qode` automatikisht (shih [Zbulimi automatik](#zbulimi-automatik-cli-vs-gui)).
>>>>>>> b51f9f42e105c6bb473c4d7f285996426711d7eb

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

## GUI i zgjeruar (v2.0.0)

Përveç `krijo_dritare`, `buton_i_ri`, `tekst_i_ri` dhe `fushe_teksti`, tani ka:

| Funksioni | Çfarë krijon | Metodat kryesore |
|---|---|---|
| `kontejner("vertikal" / "horizontal")` | rresht/kolonë elementesh | `.shto(el, shtrirje)`, `.shto_hapesire(px)`, `.shto_shtrirje()`, `.vendos_margina(...)`, `.vendos_hapesira(px)`, `.pastro()` |
| `karte(...)` | kontejner me pamje kartele (sfond i bardhë, kënde të rrumbullakosura) | si `kontejner` |
| `ekrane()` | pirg ekranesh me navigim | `.shto_ekran(w)`, `.shfaq_ekranin(i)`, `.kthehu()`, `.kthehu_te_fillimi()`, `.ekrani_aktual()`, `.kur_ndryshon(fn)` |
| `skeda()` | skeda (tabs) | `.shto_skede(widget, titulli)`, `.shko_te(i)`, `.kur_ndryshon(fn)` |
| `zone_levizese(w)` | zonë me scroll | `.vendos_permbajtjen(w)` |
| `liste(vargu)` | listë me zgjedhje | `.shto_element(t)`, `.shto_elemente(v)`, `.pastro()`, `.indeksi_zgjedhur()`, `.kur_zgjidhet(fn(indeksi, teksti))` |
| `zgjedhes(vargu)` | dropdown | `.vlera()`, `.indeksi()`, `.kur_ndryshon(fn)` |
| `kuti_zgjedhjeje(tekst)` | checkbox | `.eshte_zgjedhur()`, `.vendos_zgjedhur(po)`, `.kur_ndryshon(fn)` |
| `progres(min, max)` | shirit progresi | `.vendos_vlere(v)`, `.vendos_format(f)` |
| `imazh_i_ri(rruga, w, h)` | imazh | `.vendos_imazh(rruga)`, `.vendos_imazh_nga_te_dhena(buffer)` |
| `fushe_fjalekalimi(p)` | fushë fjalëkalimi | si `fushe_teksti` + `.shfaq_fjalekalimin(po)` |
| `zone_teksti(p)` | tekst shumërreshtor | `.merr_vleren()`, `.vendos_vleren(v)` |
| `shfaq_mesazh(titulli, teksti)` | dialog informues | — |
| `pyet(titulli, teksti)` | dialog Po/Jo, kthen `vertete`/`gabim_val` | — |
| `zgjidh_skedar(titulli, filtri)` | dialog zgjedhjeje skedari | kthen rrugën ose `asnje` |

Metoda të përbashkëta për **çdo** element: `.vendos_stil(css)`, `.vendos_madhesi(w,h)`,
`.vendos_madhesi_fikse(w,h)`, `.vendos_madhesi_maksimale(w,h)`, `.aktivizo(po)`, `.fshih()`,
`.shfaq_elementin()`, `.vendos_id(emri)`, `.vendos_keshille(tekst)`, `.vendos_kursor_dore()`,
`.kur_klikohet(fn)` (edhe mbi karta/etiketa) dhe `.kur_shtypet(fn)` (merr `{ tasti, teksti }`).

Dritarja ka gjithashtu `.vendos_permbajtjen(widget)`, `.ekran_i_plote()` dhe `.maksimizo()`.
Etiketat kanë `.mbulo_tekstin(po)` dhe `.vendos_rreshtim("qender" / "majtas" / "djathtas")`.

Shembull i plotë me ekrane dhe navigim: `shembuj/biblioteka.es`.

### Kufizime të GUI-t (sinqerisht)
- **Vetëm desktop** (Windows/macOS/Linux): Qt Widgets nuk ka iOS/Android.
- **Pa kamerë / skanim QR**: EagleGUI nuk e ekspozon kamerën. Për skanim në panelin e adminit përdor një skaner USB (vepron si tastierë): një `fushe_teksti` me `.kur_shtypet_enter(...)` merr kodin.
- **Gjenerimi i QR-ve**: përdor një paketë npm (p.sh. `qrcode`) me `require(...)` dhe shfaqe me `imazh_i_ri().vendos_imazh_nga_te_dhena(buffer)`.
- `shfaq_mesazh`/`pyet` s'kanë ikonë të personalizuar.
- GUI-ja kërkon addon-in native të ndërtuar dhe runtime-in e Qt në dispozicion.

## Skedarë të shumtë: `perfshi(...)`

Një aplikacion mund të ndahet në shumë skedarë `.es`. Çdo skedar eksporton me `module.exports` dhe
tjetri e merr me `perfshi("./rruga.es")`:

```
# modelet.es
klase Libri { konstruktor(titulli) { kete.titulli = titulli } }
module.exports = { Libri }

# kryesor.es
konstante { Libri } = perfshi("./modelet.es")
shfaq(i_ri Libri("Princi i vogel").titulli)
```

- Shtegu që fillon me `.` ose `/` lexohet relativisht me skedarin aktual; prapashtesa `.es` mund të mungojë.
- Çdo modul ngarkohet një herë (cache) dhe lejohen varësi rrethore.
- `perfshi("zlib")` (pa `.`) ngarkon modul të Node ose paketë npm.
- Gabimet në modul tregojnë skedarin dhe rreshtin e modulit.
- **`--jeteso` (paketimi) trajton vetëm skedarin kryesor** (nuk i bashkon modulet); aplikacionet me shumë skedarë ekzekutohen me `eagle`.

### Navigim me pirg te `ekrane()`
Përveç `.shto_ekran / .shfaq_ekranin / .kthehu`, ka stil Navigator: `.shtyj(widget)` (shton dhe shfaq),
`.terhiq()` (kthehet dhe heq ekranin e fundit), `.zevendeso_rrenjen(widget)`, `.pastro_historine()`.

## Aplikacioni Biblioteka (porti nga Flutter/Dart)

`biblioteka/` është porti i demos së bibliotekës shkollore nga Flutter në Eagle Script, për desktop.
**Student App** (Welcome, hyrje/regjistrim, Kreu, Librat, Detajet e librit, Afatet, Karta digjitale,
QR-ja ime, Njoftime, Profili) dhe **Admin App** (`biblioteka/admin/`: hyrja, Kreu/dashboard, Skano (placeholder),
Librat, Nxënësit, detajet e nxënësit dhe të librit, Huazim/Kthim, Njoftime, Cilësime). Nga ekrani Welcome
zgjidhet roli. Skanimi i adminit është simulim; me skaner USB përdoret `fushe_teksti`.

```
eagle biblioteka/kryesor.es
```

Struktura: `modelet.es` (Nxenesi, Libri, Huazimi, Njoftimi), `te_dhenat.es` (të dhëna mock),
`stili.es` (ngjyra + stili global), `komponente.es` (kartat, chip-et, kopertinat...), `navigimi.es`,
`qr_png.es` (QR placeholder si PNG i krijuar në memorie, pa paketa të jashtme), dhe ekranet te `nxenes/` e `perbashket/`.
Të dhënat janë të gjitha mock; nuk ka backend, database apo QR real.
Dritarja hapet në formë telefoni (420×800). Ikonat janë simbole Unicode, sepse Qt s'ka ikona Material.
Testet reale të GUI-t ekzekutohen me `node eaglegui/test.js` dhe përdorin addon-in Qt të ndërtuar.

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
<<<<<<< HEAD
├── index.js          # Pika hyrëse e CLI-t; parsim flamurësh, lexim/ruajtje skedarësh
├── perkthyes.js       # Përkthyesi Shqip ⇄ JS (skaner që njeh stringjet, komentet, template-t, regex-et)
├── interpreter.js     # Ekzekutuesi (vm) dhe formatimi i gabimeve
├── lexer.js           # Tokenizuesi (validim sintakse)
├── gui.js              # Wrapper-i shqip mbi addon-in native EagleGUI (Qt)
├── eaglegui/           # Addon-i C++/Qt, DLL-të, shtojcat dhe test.js
├── package.json
├── biblioteka/         # Porti i demos së bibliotekës (Student + Admin)
├── shembuj/            # Shembuj (biblioteka.es)
```

> Këta skedarë (`index.js`, `interpreter.js`, `lexer.js`, `gui.js`, `perkthyes.js`, `packager.js`) janë **të rezervuar**: `eagle` refuzon ta ruajë ndonjë skedar të përkthyer që do t'i mbishkruante.
=======
├── index.js          # Pika hyrëse e CLI-t; parsim flamurësh, zbulim CLI/GUI, lexim/ruajtje skedarësh
├── interpreter.js     # Përkthyesi Shqip → JS (dhe anasjelltas) + ekzekutuesi (vm)
├── lexer.js           # Tokenizuesi (validim sintakse)
├── gui.js              # Wrapper-i shqip mbi @nodegui/nodegui (Qt)
├── package.json
└── teste/              # Skriptet .es të testimit
```

> Këta katër skedarë (`index.js`, `interpreter.js`, `lexer.js`, `gui.js`) janë **të rezervuar**: `eagle` refuzon ta ruajë ndonjë skedar të përkthyer që do t'i mbishkruante.
>>>>>>> b51f9f42e105c6bb473c4d7f285996426711d7eb

---

## Kufizime dhe shënime teknike

<<<<<<< HEAD
- **Skriptet GUI ekzekutohen me `node`** — cikli i ngjarjeve Qt menaxhohet nga `gui.js`; në Windows, DLL-të dhe shtojcat ngarkohen nga dosja `eaglegui`.
=======
- **Skriptet GUI kërkojnë `qode`**, jo `node` — NodeGui përdor një fork të Node-it (`qode`) që bashkon event loop-in e Qt-it me atë të Node.js. `eagle` e zbulon dhe e rinis vetë automatikisht kur nevojitet; instalo NodeGui me `npm install @nodegui/nodegui`.
>>>>>>> b51f9f42e105c6bb473c4d7f285996426711d7eb
- **Ekzekutimi normal** (skriptet pa GUI) përdor modulin `vm` të Node-it (`vm.runInNewContext`) — kodi ekzekutohet në një kontekst të izoluar, jo direkt në procesin kryesor.
- **`--perkthe`** ruan gjithashtu një skedar `.js` të pavarur; nëse skripti përdor GUI, në rreshtin e parë të atij skedari shtohet automatikisht `require(...)` drejt `gui.js` (me shteg absolut, që të funksionojë pavarësisht ku ruhet skedari).
- Emri i skedarëve `.es` **nuk duhet të përplaset** me `index.js`, `interpreter.js`, `lexer.js` ose `gui.js`.
- Komentet mbështeten me `#` ose `//` (rresht i vetëm) dhe `/* ... */` (shumë-rreshtësh, vetëm në lexer).
<<<<<<< HEAD
- Komentet `#` dhe `//` mbështeten kudo në rresht (edhe pas stringjeve); `/* ... */` për shumë rreshta. `#` brenda stringu është tekst i zakonshëm.
- Rreshtat e kodit të përkthyer përputhen një-me-një me skedarin `.es`, ndaj gabimet tregojnë rreshtin e saktë.
- Brenda `${...}` të template-ve fjalët kyçe dhe funksionet përkthehen si kudo tjetër. Çelësat e objekteve (`{ne: 1}`) dhe emrat pas pikës (`obj.ne`) nuk ndryshojnë.
- Nëse përcakton vetë një metodë me emër të njëjtë me një metodë të gjuhës (p.sh. `filtro(...) {...}`), ajo ka përparësi në gjithë skedarin: `.filtro` nuk përkthehet më në `.filter`.
- `lexo("pyetja ")` lexon një rresht nga tastiera (sinkron).
- `klase` si emër ndryshoreje (`leje klase = "10-B"`) funksionon.
=======
>>>>>>> b51f9f42e105c6bb473c4d7f285996426711d7eb
