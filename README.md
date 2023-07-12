# Buscador de Propiedades

## Descripción

Esta aplicación rastrea mensajes de correo electrónico, extrae información sobre propiedades disponibles y genera una lista filtrada en HTML. Permite a los usuarios marcar propiedades como visitadas o favoritas.

## Características

- Extracción de información de correos electrónicos: la aplicación extrae datos como la dirección, la fecha de publicación, la categoría y el enlace de la propiedad.
- Lista de propiedades visitadas: los usuarios pueden marcar propiedades como visitadas. Estas propiedades se resaltan en la lista y se guardan en un archivo JSON para mantener un registro persistente entre las ejecuciones de la aplicación.
- Lista de propiedades favoritas: los usuarios también pueden marcar propiedades como favoritas. Al igual que con las propiedades visitadas, estas se resaltan y se guardan en un archivo JSON separado.
- Filtro de propiedades: la aplicación filtra las propiedades por categoría y evita la duplicación de direcciones.

## Uso

1. Clona este repositorio a tu máquina local.
2. Ejecuta `npm install` para instalar las dependencias.
3. Configura tus variables de entorno (por ejemplo, detalles de la cuenta de correo electrónico).
4. Ejecuta `node index.js` para iniciar la aplicación.

Al acceder a la aplicación a través del navegador, verás una lista de propiedades. Las propiedades marcadas como visitadas se resaltan con un color específico y las marcadas como favoritas se resaltan con otro color.

## Tecnologías utilizadas

- Node.js
- Express
- Google Gmail API
- Moment.js
- Cheerio

## Contribución

Las contribuciones son siempre bienvenidas.
