# Web Scrapper Spidey

Web Scrapper Spidey es una aplicacion frontend-only para hacer scraping de paginas web desde el navegador. Ya no necesita backend local, Express, archivos `.txt` ni endpoints fijos.

## Uso

1. Instalar dependencias:

```bash
npm install
npm install --prefix client
```

2. Iniciar la app:

```bash
npm run dev
```

3. Abrir la URL que muestra Create React App, normalmente `http://localhost:3000`.

## Como funciona

- Ingresa una URL.
- Elige un modo de extraccion: resumen, selectores CSS, titulos, links, imagenes, tablas o metadatos.
- Usa acceso directo si la web permite CORS.
- Usa un proxy cuando el navegador bloquee la peticion por CORS.
- Exporta los resultados como JSON o CSV.

## Nota sobre CORS

Una app 100% frontend no puede saltarse las politicas CORS del navegador. Por eso Web Scrapper Spidey incluye soporte para proxy publico de pruebas y para proxies personalizados. Para uso serio o alto volumen, conviene usar un proxy propio.

## Deploy en Vercel

El proyecto incluye `vercel.json`, asi que se puede importar el repositorio directamente desde Vercel usando la raiz del repo.

Configuracion esperada:

- Install Command: `npm install --prefix client`
- Build Command: `npm run build --prefix client`
- Output Directory: `client/build`

Vercel toma esos valores desde `vercel.json`. La app es estatica y no necesita funciones serverless ni backend.
