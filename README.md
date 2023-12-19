# Consumidor de apis de appscript de control-exter

Esta API actúa como puente entre el frontend y las apis de appscript que controlan el documento de drive donde se guardan los certificados. Originalmente hecha por el tema de CORS.

## Instalación

Run `npm install`

## Debugging

Después de instalar Run `npm run dev`

## Despliegue

Run: 
- `npm run build`
- `cd dist`
- `git init`
- `git add -A`
- `git commit -m "Deploy"`
- `git push -f https://<token>@github.com/extercontrol/control-exter.git master:gh-pages`
