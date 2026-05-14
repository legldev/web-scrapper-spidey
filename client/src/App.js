import React, { useMemo, useState } from "react";
import "./App.css";

const proxyTemplates = [
  {
    label: "Directo",
    value: "",
    helper: "Usa fetch del navegador. Funciona cuando la web permite CORS.",
  },
  {
    label: "AllOrigins",
    value: "https://api.allorigins.win/raw?url={url}",
    helper: "Proxy publico util para pruebas cuando la web bloquea CORS.",
  },
  {
    label: "Personalizado",
    value: "custom",
    helper: "Usa un proxy propio con {url} como placeholder.",
  },
];

const extractionModes = [
  { id: "summary", label: "Resumen" },
  { id: "custom", label: "Selectores" },
  { id: "headings", label: "Titulos" },
  { id: "links", label: "Links" },
  { id: "images", label: "Imagenes" },
  { id: "tables", label: "Tablas" },
  { id: "meta", label: "Meta" },
];

const defaultSelectors = {
  item: "article, .card, li",
  title: "h1, h2, h3, .title",
  value: "p, .description, .content",
  link: "a",
  image: "img",
};

const requestTimeout = 15000;

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function getText(root, selector) {
  if (!selector) {
    return "";
  }

  const element = root.querySelector(selector);
  return element ? normalizeText(element.textContent || "") : "";
}

function getAttribute(root, selector, attribute, baseUrl) {
  if (!selector) {
    return "";
  }

  const element = root.querySelector(selector);
  if (!element) {
    return "";
  }

  const value = element.getAttribute(attribute) || "";
  if (!value) {
    return "";
  }

  try {
    return new URL(value, baseUrl).href;
  } catch (error) {
    return value;
  }
}

function resolveUrl(value, baseUrl) {
  try {
    return new URL(value, baseUrl).href;
  } catch (error) {
    return value;
  }
}

function extractSummary(document, baseUrl) {
  const title = normalizeText(document.querySelector("title")?.textContent || "");
  const description =
    document.querySelector('meta[name="description"]')?.getAttribute("content") ||
    document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
    "";
  const headings = Array.from(document.querySelectorAll("h1, h2"))
    .map((heading) => normalizeText(heading.textContent || ""))
    .filter(Boolean)
    .slice(0, 12);
  const links = Array.from(document.querySelectorAll("a[href]"))
    .map((link) => ({
      text: normalizeText(link.textContent || link.getAttribute("aria-label") || ""),
      url: resolveUrl(link.getAttribute("href"), baseUrl),
    }))
    .filter((link) => link.url)
    .slice(0, 20);

  return [
    { type: "title", value: title || "Sin titulo detectado" },
    { type: "description", value: normalizeText(description) || "Sin descripcion detectada" },
    ...headings.map((value) => ({ type: "heading", value })),
    ...links.map((link) => ({ type: "link", value: link.text || link.url, url: link.url })),
  ];
}

function extractHeadings(document) {
  return Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
    .map((heading) => ({
      level: heading.tagName.toLowerCase(),
      text: normalizeText(heading.textContent || ""),
    }))
    .filter((item) => item.text);
}

function extractLinks(document, baseUrl) {
  return Array.from(document.querySelectorAll("a[href]"))
    .map((link) => ({
      text: normalizeText(link.textContent || link.getAttribute("aria-label") || ""),
      url: resolveUrl(link.getAttribute("href"), baseUrl),
    }))
    .filter((item) => item.url);
}

function extractImages(document, baseUrl) {
  return Array.from(document.querySelectorAll("img[src]"))
    .map((image) => ({
      alt: normalizeText(image.getAttribute("alt") || ""),
      src: resolveUrl(image.getAttribute("src"), baseUrl),
    }))
    .filter((item) => item.src);
}

function extractTables(document) {
  const rows = [];

  Array.from(document.querySelectorAll("table")).forEach((table, tableIndex) => {
    const headers = Array.from(table.querySelectorAll("thead th")).map((cell) =>
      normalizeText(cell.textContent || "")
    );

    Array.from(table.querySelectorAll("tr")).forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll("th, td")).map((cell) =>
        normalizeText(cell.textContent || "")
      );

      if (!cells.length || (rowIndex === 0 && headers.length)) {
        return;
      }

      const item = { table: tableIndex + 1 };
      cells.forEach((cell, cellIndex) => {
        item[headers[cellIndex] || `column_${cellIndex + 1}`] = cell;
      });
      rows.push(item);
    });
  });

  return rows;
}

function extractMeta(document) {
  return Array.from(document.querySelectorAll("meta"))
    .map((meta) => ({
      name:
        meta.getAttribute("name") ||
        meta.getAttribute("property") ||
        meta.getAttribute("http-equiv") ||
        "meta",
      content: normalizeText(meta.getAttribute("content") || ""),
    }))
    .filter((item) => item.content);
}

function extractCustom(document, selectors, baseUrl) {
  const items = Array.from(document.querySelectorAll(selectors.item)).slice(0, 250);

  return items
    .map((item, index) => ({
      index: index + 1,
      title: getText(item, selectors.title),
      value: getText(item, selectors.value),
      link: getAttribute(item, selectors.link, "href", baseUrl),
      image: getAttribute(item, selectors.image, "src", baseUrl),
    }))
    .filter((item) => item.title || item.value || item.link || item.image);
}

function extractByMode(document, mode, selectors, baseUrl) {
  if (mode === "custom") {
    return extractCustom(document, selectors, baseUrl);
  }
  if (mode === "headings") {
    return extractHeadings(document);
  }
  if (mode === "links") {
    return extractLinks(document, baseUrl);
  }
  if (mode === "images") {
    return extractImages(document, baseUrl);
  }
  if (mode === "tables") {
    return extractTables(document);
  }
  if (mode === "meta") {
    return extractMeta(document);
  }

  return extractSummary(document, baseUrl);
}

function toCsv(rows) {
  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set())
  );

  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  return [columns.map(escape).join(",")]
    .concat(rows.map((row) => columns.map((column) => escape(row[column])).join(",")))
    .join("\n");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function App() {
  const [targetUrl, setTargetUrl] = useState("https://example.com");
  const [mode, setMode] = useState("summary");
  const [proxy, setProxy] = useState(proxyTemplates[1].value);
  const [customProxy, setCustomProxy] = useState("https://api.allorigins.win/raw?url={url}");
  const [selectors, setSelectors] = useState(defaultSelectors);
  const [results, setResults] = useState([]);
  const [rawHtml, setRawHtml] = useState("");
  const [status, setStatus] = useState("Listo para scrapear una web.");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const visibleResults = useMemo(() => results.slice(0, 80), [results]);
  const columns = useMemo(() => {
    return Array.from(
      visibleResults.reduce((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set())
    );
  }, [visibleResults]);

  const selectedProxy = proxy === "custom" ? customProxy : proxy;

  const updateSelector = (key, value) => {
    setSelectors((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const buildRequestUrl = () => {
    const normalizedTarget = new URL(targetUrl).href;
    if (!selectedProxy) {
      return normalizedTarget;
    }

    return selectedProxy.includes("{url}")
      ? selectedProxy.replace("{url}", encodeURIComponent(normalizedTarget))
      : `${selectedProxy}${encodeURIComponent(normalizedTarget)}`;
  };

  const scrape = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    setStatus("Descargando HTML...");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), requestTimeout);

    try {
      const normalizedTarget = new URL(targetUrl).href;
      const response = await fetch(buildRequestUrl(), { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`La web respondio con estado ${response.status}.`);
      }

      const html = await response.text();
      const parsedDocument = new DOMParser().parseFromString(html, "text/html");
      const extracted = extractByMode(parsedDocument, mode, selectors, normalizedTarget);

      setRawHtml(html);
      setResults(extracted);
      setStatus(
        extracted.length
          ? `Listo: ${extracted.length} registros encontrados.`
          : "No se encontraron registros con esta configuracion."
      );
    } catch (requestError) {
      setResults([]);
      setRawHtml("");
      setStatus("No se pudo completar el scraping.");
      setError(
        `${
          requestError.name === "AbortError"
            ? "La solicitud tardo demasiado en responder."
            : requestError.message
        } Si estas usando modo directo, prueba con un proxy o con selectores mas especificos.`
      );
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  const exportJson = () => {
    downloadFile("scraping-results.json", JSON.stringify(results, null, 2), "application/json");
  };

  const exportCsv = () => {
    downloadFile("scraping-results.csv", toCsv(results), "text/csv");
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    setStatus("Resultados copiados al portapapeles.");
  };

  return (
    <main className="scraper-app">
      <section className="workspace">
        <aside className="control-panel">
          <div className="brand">
            <span className="brand-mark">S</span>
            <div>
              <h1>Spidey</h1>
              <p>Web scraping simple desde el navegador</p>
            </div>
          </div>

          <form onSubmit={scrape} className="scrape-form">
            <label className="field">
              <span>URL</span>
              <input
                type="url"
                value={targetUrl}
                onChange={(event) => setTargetUrl(event.target.value)}
                placeholder="https://sitio.com/pagina"
                required
              />
            </label>

            <div className="field">
              <span>Modo de extraccion</span>
              <div className="segmented-control">
                {extractionModes.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={mode === option.id ? "active" : ""}
                    onClick={() => setMode(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "custom" && (
              <div className="selector-grid">
                <label className="field">
                  <span>Items</span>
                  <input
                    value={selectors.item}
                    onChange={(event) => updateSelector("item", event.target.value)}
                    placeholder="article, .card, li"
                  />
                </label>
                <label className="field">
                  <span>Titulo</span>
                  <input
                    value={selectors.title}
                    onChange={(event) => updateSelector("title", event.target.value)}
                    placeholder="h2, .title"
                  />
                </label>
                <label className="field">
                  <span>Texto</span>
                  <input
                    value={selectors.value}
                    onChange={(event) => updateSelector("value", event.target.value)}
                    placeholder="p, .description"
                  />
                </label>
                <label className="field">
                  <span>Link</span>
                  <input
                    value={selectors.link}
                    onChange={(event) => updateSelector("link", event.target.value)}
                    placeholder="a"
                  />
                </label>
                <label className="field">
                  <span>Imagen</span>
                  <input
                    value={selectors.image}
                    onChange={(event) => updateSelector("image", event.target.value)}
                    placeholder="img"
                  />
                </label>
              </div>
            )}

            <label className="field">
              <span>Acceso</span>
              <select value={proxy} onChange={(event) => setProxy(event.target.value)}>
                {proxyTemplates.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small>
                {proxyTemplates.find((option) => option.value === proxy)?.helper ||
                  proxyTemplates[2].helper}
              </small>
            </label>

            {proxy === "custom" && (
              <label className="field">
                <span>Proxy</span>
                <input
                  value={customProxy}
                  onChange={(event) => setCustomProxy(event.target.value)}
                  placeholder="https://proxy.com/raw?url={url}"
                />
              </label>
            )}

            <button className="primary-action" type="submit" disabled={isLoading}>
              {isLoading ? "Scrapeando..." : "Scrapear web"}
            </button>
          </form>
        </aside>

        <section className="results-panel">
          <div className="results-header">
            <div>
              <p className="eyebrow">Resultados</p>
              <h2>{status}</h2>
              {error && <p className="error-message">{error}</p>}
            </div>
            <div className="actions">
              <button type="button" onClick={copyJson} disabled={!results.length}>
                Copiar
              </button>
              <button type="button" onClick={exportJson} disabled={!results.length}>
                JSON
              </button>
              <button type="button" onClick={exportCsv} disabled={!results.length}>
                CSV
              </button>
            </div>
          </div>

          <div className="stats-row">
            <div>
              <strong>{results.length}</strong>
              <span>registros</span>
            </div>
            <div>
              <strong>{rawHtml ? `${Math.round(rawHtml.length / 1024)} KB` : "0 KB"}</strong>
              <span>html</span>
            </div>
            <div>
              <strong>{mode}</strong>
              <span>modo</span>
            </div>
          </div>

          {visibleResults.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleResults.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {columns.map((column) => (
                        <td key={column}>
                          {String(row[column] === undefined ? "" : row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Ingresa una URL y elige como leerla.</h3>
              <p>
                Puedes empezar con Resumen para entender la pagina y luego pasar a Selectores
                para extraer listas, cards, productos, noticias o cualquier bloque repetido.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
