#!/usr/bin/env node
// index.js - Eagle Script CLI (Me ruajtje te dyanshme)

const fs = require('fs');
const path = require('path');
const { EagleScriptInterpreter } = require('./interpreter');
const VERSIONI = require('./package.json').version;
const { jeteso, TARGETET_DESKTOP, TARGETET_MOBILE } = require('./packager');

const args = process.argv.slice(2);

// Lexojmë argumentin e parë që duhet të jetë skedari (.es ose .js)
let skedariPerKontroll = null;
for (const arg of args) {
    if (!arg.startsWith('-')) {
        skedariPerKontroll = arg;
        break;
    }
}

// ─── --jeteso <target>: paketimi ne aplikacion te pavarur ─────────────────
const indeksiJeteso = args.indexOf('--jeteso');
if (indeksiJeteso !== -1) {
    const targeti = args[indeksiJeteso + 1];
    if (!targeti || targeti.startsWith('-')) {
        console.error(
            `Gabim: --jeteso ka nevoje per nje target: ${TARGETET_DESKTOP.join(', ')} ` +
            `(ose ${TARGETET_MOBILE.join('/')}, qe shpjegojne pse s'jane te mundshme).`
        );
        console.error(`Perdorim: eagle <skedari.es> --jeteso <target> [--nje-skedar]`);
        process.exit(1);
    }
    if (!skedariPerKontroll) {
        console.error('Gabim: --jeteso ka nevoje per nje skedar .es (p.sh. eagle app.es --jeteso windows).');
        process.exit(1);
    }
    if (!fs.existsSync(skedariPerKontroll)) {
        console.error(`Gabim: Nuk mund te gjendet skedari '${skedariPerKontroll}'.`);
        process.exit(1);
    }

    const { EagleScriptInterpreter: Interpretuesi } = require('./interpreter');
    const interpretuesiPerJeteso = new Interpretuesi({ debug: false, shfaqPerkthimin: false });

    // Kapim flamurin --nje-skedar nga argumentet e terminalit
    const njeSkedar = args.includes('--nje-skedar');
    const opsionePaketimi = { njeSkedar: njeSkedar };

    console.log(`Eagle Script: duke paketuar '${skedariPerKontroll}' per ${targeti}...`);
    const rezultatJeteso = jeteso(targeti, skedariPerKontroll, interpretuesiPerJeteso, opsionePaketimi);

    if (!rezultatJeteso.ok) {
        console.error(`\n${rezultatJeteso.mesazh}\n`);
        process.exit(1);
    }

    console.log(`\n${rezultatJeteso.mesazh}\n`);
    process.exit(0);
}
// ───────────────────────────────────────────────────────────────────────────

// ─── Mbrojtje kunder mbishkrimit te skedareve baze te paketes ─────────────
const SKEDARET_E_REZERVUAR = ['index.js', 'interpreter.js', 'lexer.js', 'gui.js', 'perkthyes.js', 'packager.js'];

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
    if (arg === '--versioni' || arg === '--version') { console.log(`Eagle Script v${VERSIONI}`); process.exit(0); }
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
    const kodiBurim = fs.readFileSync(skedari, 'utf-8');
    const interpretuesi = new EagleScriptInterpreter({ debug, shfaqPerkthimin });
    const rrugaSkedari = path.resolve(skedari);
    const opsionetEkzekutimi = {
        argv: [process.execPath, rrugaSkedari, ...argumentetPerProgramin],
        filePath: rrugaSkedari,
    };

    if (prapashtesa === '.js') {
        const kodiShqip = interpretuesi.ktheNeEagleScript(kodiBurim);
        
        console.log('─── Kodi i kthyer ne Eagle Script (Shqip) ───');
        console.log(kodiShqip);
        console.log('─────────────────────────────────────────────');

        const emriRi = skedari.replace(/\.js$/, '.es');

        if (eshteMbishkrimIRrezikshem(emriRi)) {
            console.error(`\nGabim: Emri i skedarit tend perputhet me nje skedar THEMELOR te Eagle Script-it ('${path.basename(emriRi)}').`);
            console.error(`Ruajtja u ndalua per te mbrojtur bibliotekat e brendshme te paketes.`);
            console.error(`Riemerto skriptin tend dhe provo perseri.\n`);
            process.exit(1);
        }

        fs.writeFileSync(emriRi, kodiShqip, 'utf-8');
        console.log(`\nSkedari i perkthyer u ruajt me sukses si: ${emriRi}`);
        process.exit(0);
    } else {
        if (shfaqPerkthimin) {
            const kodiJS = interpretuesi.perkthyes.perkthe(kodiBurim);
            const emriRiJS = skedari.replace(/\.es$/, '.js');

            if (eshteMbishkrimIRrezikshem(emriRiJS)) {
                console.error(`\nGabim: Emri i skriptit tend perputhet me nje skedar THEMELOR te Eagle Script-it ('${path.basename(emriRiJS)}').`);
                console.error(`Ruajtja e '.js' u ndalua per te mbrojtur bibliotekat e brendshme.\n`);
                process.exit(1);
            }

            fs.writeFileSync(emriRiJS, kodiJS, 'utf-8');
            interpretuesi.ekzekuto(kodiBurim, opsionetEkzekutimi);
            console.log(`\nSkedari i perkthyer në JavaScript u ruajt si: ${emriRiJS}`);
        } else {
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
- Eagle Script v${VERSIONI}
Gjuha e pare e programimit ne shqip
══════════════════════════════════════════════════════════

Perdorimi:
  eagle <skedari.es> [opsione]         (Ekzekuton kodin shqip)
  eagle <skedari.es> --perkthe         (Ekzekuton dhe krijon automatikisht skedarin .js)
  eagle <skedari.es> --jeteso <target> [--nje-skedar] (Paketon skriptin ne instalues .exe)
  eagle <skedari.js>                   (Kthen kodin standard JS ne Eagle Script .es)

Opsionet:
  --perkthe, -p        Shfaq dhe ruan kodin e perkthyer ne formatin tjeter
  --jeteso <target>    Paketon skriptin .es ne aplikacion standalone.
  --nje-skedar         Krijon nje instalues te vetem .exe (Program Files + Shortcut)
  --debug,   -d        Aktivizo modalitetin e debug-ut
  --versioni           Shfaq versionin e Eagle Script
  --ndihme             Shfaq kete mesazh ndihme
`);
}