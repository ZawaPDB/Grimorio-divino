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

## Sala de Mods

Se añadió una sección `#sala-mods` con acceso por sello temporal.

- Sello actual: `edlindo`.
- El estado desbloqueado usa `sessionStorage`, no `localStorage`.
- Al cerrar la pestaña, el acceso se pierde.
- Los comandos se editan en `data/mod-commands.json`.

Nota: esta opción es una barrera visual/práctica para GitHub Pages, no seguridad real de backend. No debe contener contraseñas, tokens, datos privados ni comandos peligrosos que no puedan ser vistos públicamente.
