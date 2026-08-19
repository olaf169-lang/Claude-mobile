from collector.extract import extract

STRONA = """
<html><head><title>Tytuł strony</title>
<meta property="og:title" content="Prawdziwy tytuł artykułu">
<meta property="og:image" content="/zdjecia/glowne.jpg"></head>
<body>
  <nav><p>Wiadomości Sport Kultura Biznes Technologie Kontakt Regulamin</p></nav>
  <div class="related"><p>Czytaj także: zupełnie inny tekst, wystarczająco długi, by udawał treść.</p></div>
  <article>
    <p>Rada Polityki Pieniężnej obniżyła stopy procentowe o 25 punktów bazowych na wtorkowym posiedzeniu.</p>
    <p>Decyzja była zgodna z oczekiwaniami większości analityków ankietowanych przed posiedzeniem Rady.</p>
    <p>Krótkie.</p>
    <p>Prezes NBP zapowiedział, że kolejne decyzje będą zależeć od ścieżki inflacji w nadchodzących kwartałach.</p>
  </article>
  <footer><p>Wszelkie prawa zastrzeżone. Kopiowanie treści bez zgody wydawcy jest zabronione.</p></footer>
</body></html>
"""


def test_wyciaga_tresc_artykulu_i_pomija_nawigacje():
    artykul = extract(STRONA, base_url="https://serwis.pl/news/1")
    assert artykul
    assert len(artykul.paragraphs) == 3
    assert artykul.paragraphs[0].startswith("Rada Polityki")
    assert not any("Czytaj także" in p for p in artykul.paragraphs)
    assert not any("prawa zastrzeżone" in p for p in artykul.paragraphs)
    assert not any("Regulamin" in p for p in artykul.paragraphs)


def test_czyta_metadane_i_uzupelnia_adres_obrazka():
    artykul = extract(STRONA, base_url="https://serwis.pl/news/1")
    assert artykul.title == "Prawdziwy tytuł artykułu"
    assert artykul.image == "https://serwis.pl/zdjecia/glowne.jpg"


def test_pusta_strona_nie_wywraca_potoku():
    assert not extract("")
    assert not extract("<html><body><p>za krótkie</p></body></html>")


NAUKOWY = """
<html><body><article>
<p>edited by Lisa Lock , reviewed by Robert Egan This article has been reviewed according to
Science X's editorial process and policies.</p>
<p>Editors have highlighted the following attributes while ensuring the content's credibility:
fact-checked, peer-reviewed publication, trusted source, proofread</p>
<p>To commercialize quantum computing, manufacturers need high-quality superconducting materials
that survive repeated thermal cycling without degrading.</p>
<p>The team annealed the samples at 400°C in a krypton atmosphere and measured the resulting
coherence times across twenty devices.</p>
</article></body></html>
"""


def test_odrzuca_note_o_procesie_redakcyjnym():
    """Science X dokleja do każdego tekstu notkę redakcyjną — nie jest newsem."""
    artykul = extract(NAUKOWY)
    assert len(artykul.paragraphs) == 2
    assert artykul.paragraphs[0].startswith("To commercialize")
    assert "reviewed by" not in artykul.text
    assert "peer-reviewed publication" not in artykul.text


METADANE = """
<html><body><article>
<p>Kwantowe zabezpieczenie wyborów tryton wt., 08/18/2026 - 07:11 3 minuty</p>
<p>Fizycy z Uniwersytetu Warszawskiego pokazali protokół, w którym poprawność zliczania głosów
gwarantuje splątanie kwantowe, a nie zaufanie do komisji.</p>
<p>Zespół przetestował rozwiązanie na 512 symulowanych kartach do głosowania i opisał wynik
w czasopiśmie Physical Review Letters z 17 sierpnia 2026 roku.</p>
</article></body></html>
"""


def test_odrzuca_naglowek_z_data_autorem_i_czasem_czytania():
    artykul = extract(METADANE)
    assert len(artykul.paragraphs) == 2
    assert artykul.paragraphs[0].startswith("Fizycy z Uniwersytetu")
    assert "3 minuty" not in artykul.text


def test_data_w_dlugim_akapicie_zostaje():
    """Data z godziną w środku treści to fakt, nie stopka."""
    artykul = extract(METADANE)
    assert any("17 sierpnia 2026" in p for p in artykul.paragraphs)
