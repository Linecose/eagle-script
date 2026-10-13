// packager.js - eagle-packager: "eagle <skedari.es> --jeteso"
//
// I jep "jete" nje skripti .es: e ben aplikacion Windows te gatshem per shperndarje.
//
//   1. Kopjon runtime-in: node.exe + interpreter/lexer/perkthyes/gui.js + addon-in eaglegui
//   2. Kopjon skriptin .es, modulet e perfshira me perfshi(...) dhe asetet (imazhe, ikona)
//   3. Ekzekuton windeployqt qe te mblidhen DLL-te dhe plugin-et e Qt
//   4. (opsionale, --nje-skedar) e mbeshtjell gjithcka ne nje instalues .exe (AppData + Shortcut)
//
// Kufizim: ndertimi eshte vetem per Windows dhe duhet bere NE Windows
// (windeployqt/IExpress ekzistojne vetem aty).

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TARGETET_DESKTOP = ['windows'];
const TARGETET_MOBILE = ['ios', 'android'];
const ALIASE_TARGETI = {
    win: 'windows', windows: 'windows', win32: 'windows',
    mac: 'macos', macos: 'macos', osx: 'macos', darwin: 'macos',
    linux: 'linux', ios: 'ios', iphone: 'ios', android: 'android',
};

function normalizoTargetin(target) {
    if (!target) return null;
    return ALIASE_TARGETI[String(target).toLowerCase()] || null;
}

// ─── Analiza statike e .es (ikona, permasat) ───────────────────────────────
function analizoDritaren(kodi) {
    let ikona = null, gjeresia = 800, lartesia = 600;
    let m = kodi.match(/\bikona\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/);
    if (!m) m = kodi.match(/[.\w]\s*\.\s*vendos_ikonen\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/);
    if (m) ikona = m[1];
    let d = kodi.match(/\bkrijo_dritare\s*\([^,()]*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (!d) d = kodi.match(/\bdritarja\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (!d) d = kodi.match(/\.\s*vendos_madhesi\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (d) { gjeresia = parseInt(d[1], 10); lartesia = parseInt(d[2], 10); }
    return { ikona, gjeresia, lartesia };
}

// ─── Mbledhja e varesive ───────────────────────────────────────────────────
const PRAPASHTESAT_ASETE = /\.(png|jpe?g|gif|bmp|ico|svg|webp|json|txt|csv|ttf|otf|wav|mp3|es)$/i;

function mblidhSkedaret(rrugaES, dosjaBaze, grumbulli, paralajmerime) {
    const abs = path.resolve(rrugaES);
    if (grumbulli.has(abs)) return;
    grumbulli.add(abs);
    const kodi = fs.readFileSync(abs, 'utf-8');
    const dosja = path.dirname(abs);

    for (const m of kodi.matchAll(/\bperfshi\s*\(\s*["'`](\.{1,2}[^"'`]*)["'`]\s*\)/g)) {
        let dep = path.resolve(dosja, m[1]);
        if (!path.extname(dep)) dep += '.es';
        if (!fs.existsSync(dep)) { paralajmerime.push(`perfshi('${m[1]}') nuk u gjet (${dep})`); continue; }
        mblidhSkedaret(dep, dosjaBaze, grumbulli, paralajmerime);
    }
    for (const m of kodi.matchAll(/["'`]([^"'`\n]+)["'`]/g)) {
        if (!PRAPASHTESAT_ASETE.test(m[1]) || m[1].endsWith('.es')) continue;
        const kandidat = path.resolve(dosja, m[1]);
        if (fs.existsSync(kandidat) && fs.statSync(kandidat).isFile()) grumbulli.add(kandidat);
    }
}

function kopjoMeStruktur(burimi, dosjaBurimit, dosjaDestinacionit, paralajmerime) {
    const rel = path.relative(dosjaBurimit, burimi);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
        paralajmerime.push(`'${burimi}' eshte jashte dosjes se skriptit - u anashkalua.`);
        return;
    }
    const dest = path.join(dosjaDestinacionit, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(burimi, dest);
}

// ─── Mjete te jashtme ──────────────────────────────────────────────────────
function ekzekuto(komanda, argumentet, opsione = {}) {
    console.log(`   $ ${komanda} ${argumentet.join(' ')}`);
    return spawnSync(komanda, argumentet, { stdio: 'inherit', ...opsione });
}

function gjejWindeployqt() {
    const kandidatet = [];
    for (const v of ['WINDEPLOYQT', 'QTDIR', 'QT_DIR', 'Qt6_DIR', 'CMAKE_PREFIX_PATH']) {
        const vlera = process.env[v];
        if (!vlera) continue;
        if (v === 'WINDEPLOYQT') { kandidatet.push(vlera); continue; }
        for (const p of vlera.split(path.delimiter).filter(Boolean)) {
            kandidatet.push(path.join(p, 'bin', 'windeployqt.exe'));
            kandidatet.push(path.join(p, '..', '..', '..', 'bin', 'windeployqt.exe'));
        }
    }
    for (const k of kandidatet) if (fs.existsSync(k)) return k;
    const r = spawnSync('where', ['windeployqt'], { encoding: 'utf-8' });
    if (r.status === 0) return r.stdout.split(/\r?\n/)[0].trim();
    return null;
}

// ─── Krijimi i Instaluesit Profesional (AppData + Shortcut) ────────────────
function mbeshtjellNjeExe(dosjaApp, dosjaNdertimit, emriApp, idNdertimi) {
    const stage = path.join(dosjaNdertimit, '_stage');
    fs.rmSync(stage, { recursive: true, force: true });
    fs.mkdirSync(stage, { recursive: true });

    const skedariZip = path.join(stage, 'payload.zip');

    // 1) Krijojme payload.zip duke perdorur dosjen app si cwd (shmang problemet e karaktereve speciale)
    let r = spawnSync('tar', ['-a', '-c', '-f', skedariZip, '.'], {
        cwd: dosjaApp,
        stdio: 'inherit'
    });
    if (r.status !== 0) return { ok: false, mesazh: 'tar.exe deshtoi gjate krijimit te payload.zip.' };

    // 2) instalo.vbs: Instalon ne %LOCALAPPDATA% (pa nevoje per admin) dhe krijon Shortcut
    fs.writeFileSync(path.join(stage, 'instalo.vbs'),
`Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

targetDir = sh.ExpandEnvironmentStrings("%LOCALAPPDATA%\\${emriApp}")

If Not fso.FolderExists(targetDir) Then
    fso.CreateFolder targetDir
End If

sh.Run "cmd /c tar -xf """ & fso.GetParentFolderName(WScript.ScriptFullName) & "\\payload.zip"" -C """ & targetDir & """", 0, True

desktopPath = sh.SpecialFolders("Desktop")
Set link = sh.CreateShortcut(desktopPath & "\\${emriApp}.lnk")
link.TargetPath = targetDir & "\\node.exe"
link.Arguments = "launcher.js"
link.WorkingDirectory = targetDir
link.WindowStyle = 0
link.Save

MsgBox "${emriApp} u instalua me sukses!", vbInformation, "EagleScript Setup"
`, 'utf-8');

    // 3) Skedari SED per IExpress qe prodhon instaluesin .exe
    const exeDalese = path.join(dosjaNdertimit, `${emriApp}-install-package.exe`);
    const sed = path.join(stage, 'paketa.sed');
    fs.writeFileSync(sed, [
        '[Version]', 'Class=IEXPRESS', 'SEDVersion=3',
        '[Options]', 'PackagePurpose=InstallApp', 'ShowInstallProgramWindow=0', 'HideExtractAnimation=1',
        'UseLongFileName=1', 'InsideCompressed=0', 'CAB_FixedSize=0', 'CAB_ResvCodeSigning=0',
        'RebootMode=N', 'InstallPrompt=', 'DisplayLicense=', 'FinishMessage=',
        `TargetName=${exeDalese}`, `FriendlyName=${emriApp} Installer`,
        'AppLaunched=wscript.exe instalo.vbs', 'PostInstallCmd=<None>',
        'AdminQuietInstCmd=', 'UserQuietInstCmd=', 'SourceFiles=SourceFiles',
        '[Strings]', 'FILE0="payload.zip"', 'FILE1="instalo.vbs"',
        '[SourceFiles]', `SourceFiles0=${stage}\\`,
        '[SourceFiles0]', '%FILE0%=', '%FILE1%=', '',
    ].join('\r\n'), 'latin1');

    r = ekzekuto('iexpress', ['/N', '/Q', sed]);
    if (!fs.existsSync(exeDalese)) return { ok: false, mesazh: 'IExpress nuk prodhoi instaluesin .exe.' };
    fs.rmSync(stage, { recursive: true, force: true });
    return { ok: true, exe: exeDalese };
}

// Kopjon eaglegui ekzistues (JS + .node + Qt i deployuar me pare), pa burimet.
function kopjoEagleguiTeDeployuar(burimi, destinacioni) {
    const anashkalo = new Set(['main.cpp', 'test.js', 'index.js', 'package.json', 'readme.md', 'cmakelists.txt', 'translations', 'node_modules']);
    fs.cpSync(burimi, destinacioni, {
        recursive: true,
        filter: (s) => !anashkalo.has(path.basename(s).toLowerCase()),
    });
}

// ─── Skedaret e gjeneruar ──────────────────────────────────────────────────
function shkruajLauncher(dosjaApp, emriES) {
    fs.writeFileSync(path.join(dosjaApp, 'launcher.js'), `'use strict';
const fs = require('fs');
const path = require('path');
const rrenja = __dirname;
try {
    const { EagleScriptInterpreter } = require('./runtime/interpreter');
    const skedari = path.join(rrenja, 'app', ${JSON.stringify(emriES)});
    const interp = new EagleScriptInterpreter({ debug: false, shfaqPerkthimin: false });
    interp.ekzekuto(fs.readFileSync(skedari, 'utf-8'), {
        argv: [process.execPath, skedari, ...process.argv.slice(2)],
        filePath: skedari,
        cwd: path.dirname(skedari),
    });
} catch (e) {
    fs.writeFileSync(path.join(rrenja, 'gabim.log'), String(e && e.stack || e));
    process.exitCode = 1;
}
`, 'utf-8');
}

function shkruajVbs(dosjaApp) {
    fs.writeFileSync(path.join(dosjaApp, 'start.vbs'),
`Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dosja = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = dosja
sh.Run """" & dosja & "\\node.exe"" """ & dosja & "\\launcher.js""", 0, False
`, 'utf-8');
}

function shkruajCmd(dosjaApp, emriApp) {
    fs.writeFileSync(path.join(dosjaApp, `${emriApp}.cmd`),
        `@echo off\r\nstart "" wscript.exe "%~dp0start.vbs"\r\n`, 'utf-8');
}

/**
 * @param {string} targetIRreth  'windows' (ose null => platforma aktuale)
 * @param {string} rrugaES       skedari .es
 * @param {object} interpretuesi (mbetet per pajtueshmeri me index.js)
 * @param {object} opsione       { njeSkedar, emri, asete:[dosje], mbajDist }
 */
function jeteso(targetIRreth, rrugaES, interpretuesi, opsione = {}) {
    const target = targetIRreth ? normalizoTargetin(targetIRreth) : 'windows';

    if (!target) return { ok: false, mesazh: `Target i panjohur: '${targetIRreth}'. Mbeshtetet: ${TARGETET_DESKTOP.join(', ')}.` };
    if (TARGETET_MOBILE.includes(target)) {
        return { ok: false, mesazh:
            `--jeteso ${target} nuk eshte i mundshem: eaglegui eshte Qt Widgets, toolkit vetem per desktop.\n` +
            `Per mobile do te duhej nje shtrese grafike tjeter (p.sh. WebView + Capacitor).` };
    }
    if (target !== 'windows') {
        return { ok: false, mesazh: `Paketuesi aktual (windeployqt + IExpress) mbeshtet vetem 'windows'. '${target}' do te kerkonte macdeployqt/linuxdeployqt.` };
    }
    if (process.platform !== 'win32') {
        return { ok: false, mesazh: `Ndertimi per Windows duhet bere NE Windows (windeployqt dhe IExpress ekzistojne vetem aty).` };
    }
    if (!fs.existsSync(rrugaES)) return { ok: false, mesazh: `Skedari '${rrugaES}' nuk ekziston.` };

    const rrenja = __dirname;
    const burimiEaglegui = path.join(rrenja, 'eaglegui');
    const nodeAddon = path.join(burimiEaglegui, 'build', 'Release', 'eaglegui_native.node');
    if (!fs.existsSync(nodeAddon)) {
        return { ok: false, mesazh: `Addon-i native nuk u gjet: ${nodeAddon}\nNderto me: cd eaglegui && npm run nderto` };
    }

    const absES = path.resolve(rrugaES);
    const dosjaScript = path.dirname(absES);
    const emriApp = opsione.emri || path.basename(absES, path.extname(absES));
    const dosjaNdertimit = path.join(dosjaScript, `${emriApp}-jeteso`);
    const dosjaApp = path.join(dosjaNdertimit, 'app');
    const paralajmerime = [];

    fs.rmSync(dosjaNdertimit, { recursive: true, force: true });
    fs.mkdirSync(dosjaApp, { recursive: true });

    // 1) Runtime
    console.log('1/4  Duke kopjuar runtime-in...');
    fs.copyFileSync(process.execPath, path.join(dosjaApp, 'node.exe'));
    const dosjaRuntime = path.join(dosjaApp, 'runtime');
    fs.mkdirSync(dosjaRuntime, { recursive: true });
    for (const f of ['interpreter.js', 'lexer.js', 'perkthyes.js', 'gui.js']) {
        fs.copyFileSync(path.join(rrenja, f), path.join(dosjaRuntime, f));
    }

    // 2) Skriptet dhe asetet e perdoruesit
    console.log('2/4  Duke mbledhur skriptet dhe asetet...');
    const skedaret = new Set();
    mblidhSkedaret(absES, dosjaScript, skedaret, paralajmerime);
    for (const dos of opsione.asete || []) {
        const absDos = path.resolve(dos);
        if (!fs.existsSync(absDos)) { paralajmerime.push(`--asete: '${dos}' nuk ekziston.`); continue; }
        fs.cpSync(absDos, path.join(dosjaApp, 'app', path.relative(dosjaScript, absDos)), { recursive: true });
    }
    const dosjaUser = path.join(dosjaApp, 'app');
    for (const s of skedaret) kopjoMeStruktur(s, dosjaScript, dosjaUser, paralajmerime);

    const { ikona, gjeresia, lartesia } = analizoDritaren(fs.readFileSync(absES, 'utf-8'));
    console.log(`     Dritarja: ${gjeresia}x${lartesia}${ikona ? `, ikona: ${ikona}` : ''}`);

    // 3) Qt
    console.log('3/4  Duke mbledhur Qt (windeployqt)...');
    const dosjaEaglegui = path.join(dosjaRuntime, 'eaglegui');
    fs.mkdirSync(path.join(dosjaEaglegui, 'build', 'Release'), { recursive: true });
    fs.copyFileSync(nodeAddon, path.join(dosjaEaglegui, 'build', 'Release', 'eaglegui_native.node'));

    const windeploy = gjejWindeployqt();
    if (windeploy) {
        const perkohshem = path.join(dosjaEaglegui, 'eaglegui_native.dll');
        fs.copyFileSync(nodeAddon, perkohshem);
        const r = ekzekuto(windeploy, ['--no-translations', '--compiler-runtime', '--no-opengl-sw', '--dir', dosjaEaglegui, perkohshem]);
        fs.rmSync(perkohshem, { force: true });
        if (r.status !== 0) return { ok: false, mesazh: `windeployqt deshtoi (kodi ${r.status}).` };
    } else if (fs.existsSync(path.join(burimiEaglegui, 'Qt6Core.dll'))) {
        paralajmerime.push('windeployqt nuk u gjet ne PATH - u perdor Qt-ja e deployuar tashme ne eaglegui/.');
        kopjoEagleguiTeDeployuar(burimiEaglegui, dosjaEaglegui);
    } else {
        return { ok: false, mesazh:
            `Nuk u gjet windeployqt dhe eaglegui/ nuk ka DLL te Qt.\n` +
            `Shto <Qt>\\bin ne PATH, ose vendos variablen WINDEPLOYQT me rrugen e plote.` };
    }

    // 4) Nisesit
    shkruajLauncher(dosjaApp, path.basename(absES));
    shkruajVbs(dosjaApp);
    shkruajCmd(dosjaApp, emriApp);

    let rezultatFinal = `Dosja e gatshme: ${dosjaApp}\n(nise me ${emriApp}.cmd ose start.vbs)`;
    if (opsione.njeSkedar) {
        console.log('4/4  Duke krijuar instaluesin .exe (IExpress)...');
        const id = Date.now().toString(36);
        const m = mbeshtjellNjeExe(dosjaApp, dosjaNdertimit, emriApp, id);
        if (!m.ok) return m;
        rezultatFinal = `Aplikacioni u paketua ne nje instalues te vetem: ${m.exe}`;
        if (!opsione.mbajDist) fs.rmSync(dosjaApp, { recursive: true, force: true });
    } else {
        console.log('4/4  (kaluar - perdor --nje-skedar per instaluesin .exe)');
    }

    return {
        ok: true,
        mesazh: rezultatFinal + (paralajmerime.length ? `\n\nParalajmerime:\n - ${paralajmerime.join('\n - ')}` : ''),
    };
}

module.exports = { jeteso, analizoDritaren, normalizoTargetin, TARGETET_DESKTOP, TARGETET_MOBILE };