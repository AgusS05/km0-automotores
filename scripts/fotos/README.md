# Fotos de los autos

`descargar-fotos.mjs` trae fotos reales de todos los modelos del catálogo desde Wikimedia Commons y las deja listas para usar.
Necesita Node 18 o superior e internet. No instala nada.

```bash
# desde la raíz del repositorio
node scripts/fotos/descargar-fotos.mjs --simular   # muestra qué elegiría (no descarga ni escribe nada)
node scripts/fotos/descargar-fotos.mjs             # descarga y genera todo
```

## Qué hace

1. Para cada modelo de `fotos.config.json` prueba primero las fotos fijadas en `archivos`.
2. Si faltan, busca en Commons y se queda con las que:
   - tienen licencia libre con atribución (CC BY, CC BY-SA, CC0 o dominio público; nunca NC ni ND),
   - son JPG horizontales de al menos 1280 px de ancho,
   - en el nombre tienen las palabras de `requerido` y ninguna de `excluir` (generaciones viejas, interiores, detalles, etc.).
   - el nombre no menciona un año anterior a `anioMinimo` (general, o el del modelo si tiene uno), para que no entren generaciones viejas.
3. Descarga la versión de 1280 px a `frontend/public/fotos/<modelo>-<n>.jpg`.
4. Genera:
   - `backend/src/main/resources/db/migration/R__fotos_modelos.sql`: reemplaza las fotos de ejemplo por las locales,
     con autor y licencia. Es una migración **repetible** de Flyway: se vuelve a aplicar sola cada vez que el archivo cambia.
   - `database/fotos_modelos.sql`: la misma, para consultar.
   - `docs/creditos-fotos.md`: tabla con autor, licencia y enlace de cada foto (lo pide la licencia).
   - `scripts/fotos/revision.html`: abrila en el navegador para revisar las fotos elegidas (no se sube al repo).

## Si una foto no va

Copiá el nombre del archivo (el que aparece en `revision.html` o en la consola) en `descartar` del modelo, o fijá
la que querés en `archivos` (el nombre tal como figura en Commons, sin `File:`), y volvé a correr el script.
Después reiniciá el backend para que Flyway aplique los cambios.

## Fotos propias (que no son de Commons)

Si para un modelo no hay fotos libres buenas, se puede copiar una a mano en `frontend/public/fotos/` con un nombre
que no termine en `-1.jpg`, `-2.jpg`… (por ejemplo `chevrolet-s10-prensa-1.jpg`) y declararla en `propias` del modelo:

```json
"propias": [{ "archivo": "chevrolet-s10-prensa-1.jpg", "autor": "Chevrolet", "licencia": "foto de prensa" }]
```

El script no la descarga: solo la suma primera en el SQL y en los créditos. `cantidad` en el modelo cambia cuántas
fotos lleva en total. Hoy se usa solo para la S10 actual, que no tiene fotos libres en Commons.

## Por qué Wikimedia Commons y no las fotos de las marcas

Las fotos de los sitios oficiales tienen derechos reservados. Las de Commons tienen licencias que permiten usarlas
y publicarlas citando al autor, que es lo que hace la página "Créditos" del sitio y `docs/creditos-fotos.md`.
