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
