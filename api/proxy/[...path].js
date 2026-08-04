// Ce fichier doit être placé dans un dossier "api/proxy/" à la RACINE
// du projet (au même niveau que "src", pas dedans), avec ce nom exact :
// api/proxy/[...path].js
//
// Vercel le transforme automatiquement en petite fonction serveur.
// Rôle : recevoir les requêtes de l'appli React (même site, donc pas
// de blocage CORS), puis les retransmettre vers InfinityFree
// "serveur à serveur" (les blocages CORS ne s'appliquent qu'entre
// un navigateur et un site différent, jamais entre deux serveurs).

const TARGET = "https://poulailler.infinityfreeapp.com";

export default async function handler(req, res) {
  try {
    const { path, ...rest } = req.query;
    const segments = Array.isArray(path) ? path.join("/") : path || "";
    const qs = new URLSearchParams(rest).toString();
    const url = `${TARGET}/${segments}${qs ? "?" + qs : ""}`;

    const init = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    };
    if (req.method === "POST") {
      init.body = JSON.stringify(req.body || {});
    }

    const upstream = await fetch(url, init);
    const text = await upstream.text();

    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: "Erreur du relais : " + err.message });
  }
}
