# Grimorio de Zawa — estructura Ponytail

Esta versión separa el proyecto para GitHub Pages sin meter dependencias innecesarias.

## Estructura

```text
index.html
assets/
  css/styles.css
  js/app.js
  img/
    embedded/        # imágenes que antes estaban en base64 dentro del HTML/JSON/JS
    icons/           # íconos optimizados y nombrados para futuras ediciones
data/
  commands-data.json
```

## Cómo subirlo a GitHub Pages

Sube el contenido de esta carpeta al repositorio. No subas el ZIP como archivo final: descomprímelo y sube `index.html`, `assets/` y `data/`.

## Principio aplicado

- HTML ligero.
- CSS separado.
- JS separado.
- Datos separados en JSON.
- Assets externos y optimizados.
- Sin React/Next/Astro todavía porque esta etapa no lo necesita para funcionar.
- La estructura queda lista para migrar a Astro cuando el Grimorio necesite componentes reales con build.
