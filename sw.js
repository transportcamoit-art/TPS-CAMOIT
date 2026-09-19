/*
 * Service worker minimal, nécessaire pour que le navigateur
 * considère cette page comme une vraie PWA installable.
 *
 * Il met seulement en cache la coquille de l'appli (index.html)
 * pour un chargement plus rapide au lancement. Le contenu réel
 * de l'appli (dans l'iframe, servi par Google Apps Script) n'est
 * PAS mis en cache : il doit rester à jour et nécessite de toute
 * façon une connexion internet pour lire/écrire le Google Sheet.
 */

var NOM_CACHE = "saisie-journaliere-v1";

var FICHIERS_A_METTRE_EN_CACHE = [
  "./index.html",
  "./manifest.json"
];


self.addEventListener("install", function(event) {

  event.waitUntil(
    caches.open(NOM_CACHE).then(function(cache) {
      return cache.addAll(FICHIERS_A_METTRE_EN_CACHE);
    })
  );

  self.skipWaiting();
});


self.addEventListener("activate", function(event) {

  event.waitUntil(

    caches.keys().then(function(nomsCaches) {

      return Promise.all(
        nomsCaches
          .filter(function(nom) {
            return nom !== NOM_CACHE;
          })
          .map(function(nom) {
            return caches.delete(nom);
          })
      );
    })
  );

  self.clients.claim();
});


self.addEventListener("fetch", function(event) {

  // On ne sert depuis le cache que la coquille de l'appli
  // (même origine). Tout ce qui vient de Google (l'iframe vers
  // script.googleusercontent.com) passe directement par le
  // réseau, sans jamais être mis en cache.

  var url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(

    caches.match(event.request).then(function(reponseEnCache) {

      return reponseEnCache || fetch(event.request);
    })
  );
});
