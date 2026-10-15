# Shembull: demo e vogel e bibliotekes ne Eagle Script (vetem UI + te dhena mock)
# Ekzekutohet me:  eagle shembuj/biblioteka.es      (kerkon NodeGui + qode)

konstante librat = [
    { titulli: "Kronike ne gur", autori: "Ismail Kadare", i_lire: gabim_val },
    { titulli: "Princi i vogel", autori: "Antoine de Saint-Exupery", i_lire: gabim_val },
    { titulli: "Vargjet e lira", autori: "Migjeni", i_lire: vertete },
    { titulli: "Romeo dhe Zhuljeta", autori: "William Shakespeare", i_lire: vertete },
]

leje dritarja = krijo_dritare("Biblioteka Digjitale", 420, 560)
leje faqet = ekrane()

# --- Ekrani 0: lista e librave ---
leje ekraniLista = kontejner("vertikal")
ekraniLista.vendos_margina(16)
ekraniLista.shto(tekst_i_ri("Librat").vendos_stil("font-size: 24px; font-weight: bold;"))

leje lista = liste(librat.harton(funksion(l) { kthe l.titulli }))
ekraniLista.shto(lista, 1)

# --- Ekrani 1: detajet ---
leje ekraniDetaje = kontejner("vertikal")
ekraniDetaje.vendos_margina(16)
leje titulliDetaje = tekst_i_ri("").vendos_stil("font-size: 22px; font-weight: bold;")
leje autoriDetaje = tekst_i_ri("")
leje gjendjaDetaje = tekst_i_ri("")
leje butoniMbrapa = buton_i_ri("Kthehu")
butoniMbrapa.kur_klikohet(funksion() { faqet.kthehu() })

ekraniDetaje.shto(titulliDetaje)
ekraniDetaje.shto(autoriDetaje)
ekraniDetaje.shto(gjendjaDetaje)
ekraniDetaje.shto_shtrirje()
ekraniDetaje.shto(butoniMbrapa)

lista.kur_zgjidhet(funksion(indeksi, teksti) {
    konstante libri = librat[indeksi]
    titulliDetaje.vendos_tekst(libri.titulli)
    autoriDetaje.vendos_tekst("Autori: " + libri.autori)
    gjendjaDetaje.vendos_tekst(libri.i_lire ? "I lire per huazim" : "I huazuar")
    faqet.shfaq_ekranin(1)
})

faqet.shto_ekran(ekraniLista)
faqet.shto_ekran(ekraniDetaje)
dritarja.vendos_permbajtjen(faqet)
dritarja.shfaqe()
