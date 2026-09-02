# Biblioteki z zewnątrz

## qrcode.mjs

Generator kodów QR — Kazuhiko Arase, licencja MIT, pakiet npm
[`qrcode-generator`](https://www.npmjs.com/package/qrcode-generator) 2.0.4,
plik `dist/qrcode.mjs` **bez żadnych zmian**.

Leży tutaj, a nie jest ładowany z CDN, bo aplikacja ma działać także wtedy, gdy
telefon prowadzącego ma słaby zasięg — a kod QR jest potrzebny na samym starcie
wieczoru. Rysowaniem zajmuje się `js/qr.js`; ten plik tylko liczy moduły.

Podmiana na nowszą wersję: `npm pack qrcode-generator`, rozpakować, skopiować
`package/dist/qrcode.mjs`.
