/* M&B Goat Guide: start: uruchomienie po wczytaniu wszystkich skryptów */
try{ new IntersectionObserver(es=>{ sgOutVisible = es[0].isIntersecting; updMini(); }).observe($("sg-out")); }catch(e){}
renderUnits();
route();
// Tryb offline: service worker tylko w samodzielnej wersji (na claude.ai nie jest dozwolony).
if("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && !window.claude){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}
