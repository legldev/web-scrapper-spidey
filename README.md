# Web Scrapper Spidey

Web Scrapper Spidey es una herramienta frontend-only para inspeccionar paginas web y extraer datos estructurados directamente desde el navegador. Nacio como un scraper atado a una sola web y ahora funciona como una app generica, sin backend local, sin Express, sin archivos `.txt` y sin endpoints fijos.

## Caracteristicas

- Scraping desde el navegador usando `fetch` y `DOMParser`.
- Modos de extraccion para resumen, selectores CSS, titulos, links, imagenes, tablas y metadatos.
- Selectores CSS configurables para extraer listas, cards, productos, noticias o bloques repetidos.
- Exportacion de resultados en JSON y CSV.
- Copiado rapido al portapapeles.
- Soporte para acceso directo o proxy cuando una pagina bloquea solicitudes por CORS.
- Deploy estatico listo para Vercel.

## Stack

- React 16
- Create React App
- CSS plano
- Vercel para deploy estatico

## Requisitos

- Node.js
- npm

El proyecto usa `react-scripts@3`, por eso los scripts incluyen `NODE_OPTIONS=--openssl-legacy-provider` para funcionar correctamente con versiones modernas de Node.

## Instalacion

Desde la raiz del proyecto:

```bash
npm install
npm install --prefix client
```

## Desarrollo local

```bash
npm run dev
```

La app queda disponible normalmente en:

```bash
http://localhost:3000
```

## Scripts disponibles

```bash
npm run dev
```

Inicia la app en modo desarrollo.

```bash
npm run build
```

Genera el build de produccion en `client/build`.

```bash
npm test
```

Ejecuta los tests del cliente sin modo watch.

```bash
npm run install:client
```

Instala dependencias dentro de `client`.

## Como usar la app

1. Ingresa la URL de la pagina que quieres analizar.
2. Elige un modo de extraccion.
3. Usa `Directo` si la web permite CORS.
4. Usa `AllOrigins` o un proxy personalizado si el navegador bloquea la solicitud.
5. Revisa la tabla de resultados.
6. Exporta los datos como JSON o CSV.

## Modos de extraccion

- `Resumen`: extrae titulo, descripcion, encabezados principales y links relevantes.
- `Selectores`: permite definir selectores CSS para items, titulo, texto, link e imagen.
- `Titulos`: lista encabezados `h1` a `h6`.
- `Links`: extrae enlaces y resuelve URLs relativas.
- `Imagenes`: extrae imagenes y textos `alt`.
- `Tablas`: convierte filas de tablas HTML en registros.
- `Meta`: lista metatags utiles para SEO y social previews.

## Ejemplo de selectores

Para una pagina con cards de productos:

```text
Items: .product-card
Titulo: .product-title
Texto: .product-description
Link: a
Imagen: img
```

Para una lista de articulos:

```text
Items: article
Titulo: h2
Texto: p
Link: a
Imagen: img
```

## Nota importante sobre CORS

Una app 100% frontend no puede saltarse las politicas CORS del navegador. Si una web no permite solicitudes desde otros origenes, el modo `Directo` puede fallar aunque la URL exista y cargue bien en una pestaña normal.

Para esos casos, la app permite usar un proxy. El proxy publico incluido sirve para pruebas, pero para uso serio, alto volumen o datos sensibles conviene usar un proxy propio.

## Deploy en Vercel

El proyecto incluye `vercel.json`, asi que puede importarse en Vercel usando la raiz del repositorio.

Configuracion esperada:

- Install Command: `npm install --prefix client`
- Build Command: `npm run build --prefix client`
- Output Directory: `client/build`

Vercel toma esos valores desde `vercel.json`. La app es estatica y no necesita funciones serverless ni backend.

## Estructura

```text
.
├── client/
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── App.css
│       └── App.test.js
├── package.json
├── vercel.json
└── README.md
```

## Limitaciones

- No ejecuta JavaScript de la pagina scrapeada; analiza el HTML recibido.
- No puede acceder a contenido protegido por login sin una estrategia adicional.
- No reemplaza un crawler backend para scraping masivo.
- La disponibilidad de proxies publicos puede variar.

## Validacion

Comandos usados para validar el proyecto:

```bash
npm test -- --watchAll=false
npm run build --prefix client
```

---

[© fuzzdea. Made with ♥.](https://fuzzdea.com)
