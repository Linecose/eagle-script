// gui.js - Eagle Script GUI (Shqip mbi @nodegui/nodegui / Qt)
//
// Ky modul mbeshtjell klasat kryesore te NodeGui me emra shqip, ne menyre
// qe skriptet .es te mund te krijojne aplikacione desktop pa pasur nevoje
// te njohin API-n origjinale te Qt.
//
// SHENIM I RENDESISHEM: NodeGui perdor nje binar te modifikuar te Node
// (qode) qe bashkon event loop-in e Qt me ate te Node.js. Skriptet qe
// perdorin gui.js DUHET te ekzekutohen permes 'qode', jo permes 'node' te
// zakonshem, perndryshe dritarja nuk do te shfaqet dhe procesi do te
// mbyllet menjehere.

let nodegui;
try {
    nodegui = require('@nodegui/nodegui');
} catch (e) {
    nodegui = null;
}

const {
    QMainWindow,
    QWidget,
    QPushButton,
    QLabel,
    QLineEdit,
    QGridLayout,
} = nodegui || {};

// Regjistri i dritareve aktive. E mbajme referencen ketu (jashte kontekstit
// 'vm' te interpretuesit) qe motori i JS-it te mos i shkaterroje ('garbage
// collect') objektet native te Qt-it sapo funksioni ekzekuto() te kthehet.
const _dritaretAktive = new Set();

function _sigurohu() {
    if (!nodegui) {
        throw new Error(
            "Paketa '@nodegui/nodegui' nuk eshte instaluar. Instaloje me: npm install @nodegui/nodegui"
        );
    }
}

// Shton metoda te perbashketa (stil CSS dhe permasa fikse) tek cdo widget,
// qe te mos i perseritim per buton, etikete, fushe teksti, etj.
function _shtoMetodatBazike(widget) {
    widget.vendos_stil = function (css) {
        widget.setStyleSheet(css);
        return widget;
    };
    widget.vendos_madhesi = function (gjeresia, lartesia) {
        widget.setMinimumSize(gjeresia, lartesia);
        return widget;
    };
    widget.vendos_focus = function () {
        try {
            widget.setFocus();
        } catch (e) {}
        return widget;
    };
    widget.kur_shtypet = function (funksioni) {
        const emrat = ['keyPress', 'keyRelease', 'keydown', 'keyup', 'keyPressEvent', 'keyReleaseEvent'];
        for (const emri of emrat) {
            try {
                widget.addEventListener(emri, funksioni);
            } catch (e) {}
        }
        return widget;
    };
    return widget;
}

// ─── Dritarja kryesore ─────────────────────────────────────────────────────
function krijo_dritare(titulli = 'Eagle Script App', gjeresia = 500, lartesia = 400) {
    _sigurohu();

    const dritarja = new QMainWindow();
    dritarja.setWindowTitle(titulli);
    dritarja.resize(gjeresia, lartesia);

    // Widget qendror me QGridLayout te krijuar automatikisht - perdoruesi
    // nuk ka nevoje te dije asgje per layout-e te ndersjella te Qt-it, por
    // mund te japi rresht/kolone kur i duhet nje rregullim me i sakte
    // (p.sh. per nje tastiere kalkulatori).
    const qendra = new QWidget();
    qendra.setObjectName('eagle-rrenja');
    const gridLayout = new QGridLayout();
    gridLayout.setSpacing(8);
    gridLayout.setContentsMargins(10, 10, 10, 10);
    qendra.setLayout(gridLayout);
    dritarja.setCentralWidget(qendra);

    // Numeron automatikisht rreshtin tjeter te lire kur .shto() therritet
    // pa koordinata (perdorim i thjeshte, pa grid manual).
    let rreshtiAutomatikeTjeter = 0;

    // .shto(element) -> vendoset automatikisht ne rreshtin tjeter te lire
    // .shto(element, rreshti, kolona, rreshtaShtrire, kolonaShtrire) -> pozicion i sakte ne grid
    dritarja.shto = function (element, rreshti, kolona, rreshtaShtrire, kolonaShtrire) {
        if (rreshti === undefined) {
            gridLayout.addWidget(element, rreshtiAutomatikeTjeter, 0, 1, 1);
            rreshtiAutomatikeTjeter++;
        } else {
            const k = kolona === undefined ? 0 : kolona;
            const rS = rreshtaShtrire === undefined ? 1 : rreshtaShtrire;
            const kS = kolonaShtrire === undefined ? 1 : kolonaShtrire;
            gridLayout.addWidget(element, rreshti, k, rS, kS);
            rreshtiAutomatikeTjeter = Math.max(rreshtiAutomatikeTjeter, rreshti + rS);
        }
        return dritarja;
    };

    // .shfaqe() -> e shfaq dritaren dhe e regjistron qe te mos fshihet nga GC
    dritarja.shfaqe = function () {
        dritarja.show();
        _dritaretAktive.add(dritarja);
        return dritarja;
    };

    // .mbylle() -> e mbyll dritaren dhe e heq nga regjistri
    dritarja.mbylle = function () {
        _dritaretAktive.delete(dritarja);
        dritarja.close();
        return dritarja;
    };

    // .vendos_titull(t) -> ndryshon titullin
    dritarja.vendos_titull = function (t) {
        dritarja.setWindowTitle(t);
        return dritarja;
    };

    // .vendos_stil(css) -> stilizim CSS mbi dritaren (setStyleSheet)
    dritarja.vendos_stil = function (css) {
        dritarja.setStyleSheet(css);
        return dritarja;
    };

    // .vendos_madhesi(w, h) -> perdorim resize() dhe minimumSize() per te
    // mbajtur UI-n e butueshëm dhe të lëvizshëm në ekran.
    dritarja.vendos_madhesi = function (gjeresia2, lartesia2) {
        dritarja.resize(gjeresia2, lartesia2);
        dritarja.setMinimumSize(Math.max(280, gjeresia2 - 40), Math.max(360, lartesia2 - 40));
        return dritarja;
    };

    dritarja.kur_shtypet = function (funksioni) {
        const emrat = ['keyPress', 'keyRelease', 'keydown', 'keyup', 'keyPressEvent', 'keyReleaseEvent'];
        for (const emri of emrat) {
            try {
                dritarja.addEventListener(emri, funksioni);
            } catch (e) {}
        }
        return dritarja;
    };

    return dritarja;
}

// ─── Buton ──────────────────────────────────────────────────────────────────
function buton_i_ri(tekstiButonit = 'Kliko') {
    _sigurohu();
    const butoni = new QPushButton();
    butoni.setText(tekstiButonit);

    butoni.kur_klikohet = function (funksioni) {
        butoni.addEventListener('clicked', funksioni);
        return butoni;
    };

    butoni.vendos_tekst = function (t) {
        butoni.setText(t);
        return butoni;
    };

    _shtoMetodatBazike(butoni);
    return butoni;
}

// ─── Etikete / Tekst ────────────────────────────────────────────────────────
function tekst_i_ri(permbajtja = '') {
    _sigurohu();
    const eticheta = new QLabel();
    eticheta.setText(permbajtja);

    eticheta.vendos_tekst = function (t) {
        eticheta.setText(t);
        return eticheta;
    };

    _shtoMetodatBazike(eticheta);
    return eticheta;
}

// ─── Fushe teksti (input) ───────────────────────────────────────────────────
function fushe_teksti(placeholder = '') {
    _sigurohu();
    const fusha = new QLineEdit();
    fusha.setPlaceholderText(placeholder);

    fusha.merr_vleren = () => fusha.text();
    fusha.vendos_vleren = function (v) {
        fusha.setText(v);
        return fusha;
    };
    fusha.kur_ndryshon = function (funksioni) {
        fusha.addEventListener('textChanged', funksioni);
        return fusha;
    };

    // .beje_read_only(true/false) -> QLineEdit.setReadOnly, e dobishme per
    // ekranin e nje kalkulatori qe s'duhet redaktuar direkt nga perdoruesi.
    fusha.beje_read_only = function (vlera) {
        fusha.setReadOnly(!!vlera);
        return fusha;
    };

    _shtoMetodatBazike(fusha);
    return fusha;
}

module.exports = {
    krijo_dritare,
    buton_i_ri,
    tekst_i_ri,
    fushe_teksti,
    _dritaretAktive, // eksportohet vetem per debug/testim, jo per perdorim ne skriptet .es
};
