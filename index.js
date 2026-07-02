#!/usr/bin/env node
// index.js - Eagle Script CLI (Me ruajtje te dyanshme)

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { EagleScriptInterpreter } = require('./interpreter');

let args = process.argv.slice(2);

// ─── Zbulimi automatik CLI vs GUI ──────────────────────────────────────────
const FUNKSIONET_GUI = ['krijo_dritare', 'buton_i_ri', 'tekst_i_ri', 'fushe_teksti'];

function perdorGUI(kodi) {
    return FUNKSIONET_GUI.some((fn) => new RegExp(`\\b${fn}\\b`).test(kodi));
}

// RREGULLIMI 1: Kontrollojmë process.versions.qode OSE nëse kemi kaluar argumentin e fshehur '--nejmjet-qode'
function eshteNenQode() {
    const kaVersionQode = !!(process.versions && process.versions.qode);
    const kaFlagRinisje = process.argv.includes('--nejmjet-qode');
    return kaVersionQode || kaFlagRinisje;
}

function gjejBinarinQode() {
    const prapashtesa = process.platform === 'win32' ? '.cmd' : '';

    const kandidatet = [
        path.join(__dirname, 'node_modules', '.bin', `qode${prapashtesa}`),
        path.join(__dirname, '..', 'node_modules', '.bin', `qode${prapashtesa}`),
        process.platform === 'win32' ? `qode${prapashtesa}` : 'qode'
    ];

    for (const kandidat of kandidatet) {
        try {
            if (fs.existsSync(kandidat)) {
                if (process.platform === 'win32' && kandidat.includes(' ')) {
                    return `"${kandidat}"`;
                }
                return kandidat;
            }
        } catch (e) {}
    }

    return process.platform === 'win32' ? `qode${prapashtesa}` : 'qode';
}

// Lexojmë argumentin e parë që duhet të jetë skedari (.es ose .js)
let skedariPerKontroll = null;
const argsPastruar = args.filter(arg => arg !== '--nejmjet-qode'); // Heqim flag-un tonë nga argumentet e programit

for (const arg of argsPastruar) {
    if (!arg.startsWith('-')) {
        skedariPerKontroll = arg;
        break;
    }
}

// RREGULLIMI 3: 'args' rialokohet gjithnje qe te mos permbaje flag-un e brendshem
// '--nejmjet-qode'. Ndryshe, sapo te ekzekutohej nen qode, cikli i parsimit te
// flamurve me poshte do ta merrte '--nejmjet-qode' si emrin e skedarit (pasi
// nuk e njeh si flamur te vlefshem), dhe programi do te thoshte gabimisht
// "skedari nuk mbaron me .es/.js" ne vend te ekzekutoje aplikacionin GUI.
args = argsPastruar;

if (skedariPerKontroll && fs.existsSync(skedariPerKontroll)) {
    const kodiPeshkimit = fs.readFileSync(skedariPerKontroll, 'utf-8');

    if (perdorGUI(kodiPeshkimit) && !eshteNenQode()) {
        console.log("Eagle Script: u zbulua kod GUI, duke rinisur me qode...");
        const binariQode = gjejBinarinQode();

        const skedariInterpretuesit = process.platform === 'win32' && __filename.includes(' ')
            ? `"${__filename}"`
            : __filename;

        const argumentetE_Rregulluara = argsPastruar.map(arg => {
            if (process.platform === 'win32' && arg.includes(' ') && !arg.startsWith('"')) {
                return `"${arg}"`;
            }
            return arg;
        });

        // RREGULLIMI 2: Shtojmë '--nejmjet-qode' që procesi i ri ta dijë që sapo u rinis
        const rezultat = spawnSync(binariQode, [skedariInterpretuesit, '--nejmjet-qode', ...argumentetE_Rregulluara], {
            stdio: 'inherit',
            shell: true,
            windowsVerbatimArguments: true
        });

        if (rezultat.error) {
            console.error("\nGabim: Nuk u gjet binari 'qode' i nevojshem per aplikacione GUI.");
            console.error("Instaloje me: npm install @nodegui/nodegui");
            console.error(`Detaje: ${rezultat.error.message}\n`);
            process.exit(1);
        }
        process.exit(rezultat.status ?? 0);
    }
}
// ───────────────────────────────────────────────────────────────────────────

// ─── Mbrojtje kunder mbishkrimit te skedareve baze te paketes ─────────────
// Nese skripti i perdoruesit quhet p.sh. "gui.es", "interpreter.es",
// "lexer.es" ose "index.es", perkthimi automatik (--perkthe) do te
// prodhonte nje skedar .js me te njejtin emer si nje skedar THEMELOR i
// vete Eagle Script-it. Nese ndodhen ne te njejten dosje, kjo do te
// MBISHKRUANTE bibliotekat tona (p.sh. gui.js) me kodin e perkthyer te
// perdoruesit, duke thyer gjithcka. E parandalojme kete ketu.
const SKEDARET_E_REZERVUAR = ['index.js', 'interpreter.js', 'lexer.js', 'gui.js'];

function eshteMbishkrimIRrezikshem(rrugaDestinacion) {
    const emriBaze = path.basename(rrugaDestinacion);
    if (!SKEDARET_E_REZERVUAR.includes(emriBaze)) return false;
    const rrugaERezervuar = path.resolve(__dirname, emriBaze);
    const rrugaDestinacionAbs = path.resolve(rrugaDestinacion);
    return rrugaERezervuar === rrugaDestinacionAbs;
}

// Parse flags
let debug = false;
let shfaqPerkthimin = false;
let skedari = null;
const argumentetPerProgramin = [];

for (const arg of args) {
    if (arg === '--debug' || arg === '-d')        { debug = true; continue; }
    if (arg === '--perkthe' || arg === '-p')       { shfaqPerkthimin = true; continue; }
    if (arg === '--ndihme' || arg === '--help')    { shfaqNdihme(); process.exit(0); }
    if (arg === '--versioni' || arg === '--version') { console.log('Eagle Script v2.0.0'); process.exit(0); }
    if (!skedari) {
        skedari = arg;
        continue;
    }
    argumentetPerProgramin.push(arg);
}

if (!skedari) {
    console.log('Perdorimi: eagle <skedari.es | skedari.js> [opsione]');
    console.log('Perdorni --ndihme per me shume informacion.');
    process.exit(1);
}

const prapashtesa = path.extname(skedari);

if (prapashtesa !== '.es' && prapashtesa !== '.js') {
    console.log("Gabim: Eagle Script pranon vetem skedare qe mbarojne me '.es' ose '.js'!");
    process.exit(1);
}

try {
    // Shenim: zbulimi GUI vs CLI dhe rinisja e mundshme me 'qode' ndodhin
    // me lart, para analizimit te flamurve, ne bllokun "Zbulimi automatik
    // CLI vs GUI". Ne kete pike e dime tashme se po ekzekutohemi ne
    // mjedisin e duhur (node per CLI, qode per GUI).
    const kodiBurim = fs.readFileSync(skedari, 'utf-8');
    const interpretuesi = new EagleScriptInterpreter({ debug, shfaqPerkthimin });
    const rrugaSkedari = path.resolve(skedari);
    const opsionetEkzekutimi = {
        argv: [process.execPath, rrugaSkedari, ...argumentetPerProgramin],
        filePath: rrugaSkedari,
    };

    // Kahu 1: Nëse skedari është JavaScript, bëj përkthimin e anasjelltas në Eagle Script
    if (prapashtesa === '.js') {
        const kodiShqip = interpretuesi.ktheNeEagleScript(kodiBurim);
        
        console.log('─── Kodi i kthyer ne Eagle Script (Shqip) ───');
        console.log(kodiShqip);
        console.log('─────────────────────────────────────────────');

        const emriRi = skedari.replace('.js', '.es');

        if (eshteMbishkrimIRrezikshem(emriRi)) {
            console.error(`\nGabim: Emri i skedarit tend perputhet me nje skedar THEMELOR te Eagle Script-it ('${path.basename(emriRi)}').`);
            console.error(`Ruajtja u ndalua per te mbrojtur bibliotekat e brendshme te paketes.`);
            console.error(`Riemerto skriptin tend (p.sh. jo 'gui.js', 'index.js', 'interpreter.js' apo 'lexer.js') dhe provo perseri.\n`);
            process.exit(1);
        }

        fs.writeFileSync(emriRi, kodiShqip, 'utf-8');
        console.log(`\nSkedari i perkthyer u ruajt me sukses si: ${emriRi}`);
        process.exit(0);
    } else {
        // Kahu 2: Skedari është Eagle Script (.es), ekzekutohet si zakonisht
        
        // VEÇORIA E RE: Nëse përdoruesi kërkoi --perkthe, ruajmë edhe skedarin .js automatikisht
        if (shfaqPerkthimin) {
            // Marrim kodin e perkthyer nga klasa Perkthyes e interpretuesit
            const kodiJS = interpretuesi.perkthyes.perkthe(kodiBurim);
            const emriRiJS = skedari.replace('.es', '.js');

            if (eshteMbishkrimIRrezikshem(emriRiJS)) {
                console.error(`\nGabim: Emri i skriptit tend perputhet me nje skedar THEMELOR te Eagle Script-it ('${path.basename(emriRiJS)}').`);
                console.error(`Ruajtja e '.js' u ndalua per te mbrojtur bibliotekat e brendshme te paketes (p.sh. gui.js).`);
                console.error(`Riemerto skriptin tend (p.sh. "numeruesi.es" ne vend te "gui.es") dhe provo perseri.\n`);
                process.exit(1);
            }

            // Ruajmë skedarin .js
            fs.writeFileSync(emriRiJS, kodiJS, 'utf-8');
            
            // Ekzekutojmë kodin po ashtu (pasi ky është sjellja standarde e interpretuesit për .es)
            interpretuesi.ekzekuto(kodiBurim, opsionetEkzekutimi);
            
            console.log(`\nSkedari i perkthyer në JavaScript u ruajt si: ${emriRiJS}`);
        } else {
            // Nëse nuk ka flamur --perkthe, thjesht ekzekutoje në prapavijë pa krijuar skedar .js
            interpretuesi.ekzekuto(kodiBurim, opsionetEkzekutimi);
        }
    }
} catch (gabim) {
    if (gabim.code === 'ENOENT') {
        console.error(`Gabim: Nuk mund te gjendet skedari '${skedari}'`);
    } else {
        console.error(`Gabim: ${gabim.message}`);
    }
    process.exit(1);
}

function shfaqNdihme() {
    console.log(`
Eagle Script v2.0.0 - Gjuha e pare e programimit ne shqip
══════════════════════════════════════════════════════════

Perdorimi:
  eagle <skedari.es> [opsione]     (Ekzekuton kodin shqip)
  eagle <skedari.es> --perkthe     (Ekzekuton dhe krijon automatikisht skedarin .js)
  eagle <skedari.js>               (Kthen kodin standard JS ne Eagle Script .es)

Opsionet:
  --perkthe, -p     Shfaq dhe ruan kodin e perkthyer ne formatin tjeter
  --debug,   -d     Aktivizo modalitetin e debug-ut
  --versioni        Shfaq versionin e Eagle Script
  --ndihme          Shfaq kete mesazh ndihme

Shenim: Nese skripti .es perdor funksione GUI (krijo_dritare, buton_i_ri,
tekst_i_ri, fushe_teksti), Eagle Script e zbulon vete kete dhe rinis
automatikisht ekzekutimin permes 'qode' (kerkohet: npm install
@nodegui/nodegui @nodegui/qode). Per skriptet e zakonshme CLI nuk nevojitet
asnje veprim shtese.
`);
}