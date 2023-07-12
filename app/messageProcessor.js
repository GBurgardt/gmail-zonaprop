const atob = require("atob");
const cheerio = require("cheerio");
const { getMessage } = require("./gmail");
const moment = require("moment");
const axios = require("axios");
const util = require("util");

const fs = require("fs");

moment.locale("es");

let visitedProperties = [];
try {
  const data = fs.readFileSync("visitedProperties.json", "utf8");
  visitedProperties = JSON.parse(data);
} catch (err) {
  console.error(err);
}

let favoriteProperties = [];
try {
  const data = fs.readFileSync("favoriteProperties.json", "utf8");
  favoriteProperties = JSON.parse(data);
} catch (err) {
  console.error(err);
}

async function processMessages(auth, messages) {
  let filteredHTML = `
  <!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.3/css/bulma.min.css">
</head>
<style>
.is-visited {
  background: linear-gradient(to right, #eee, #ddd);
  color: #666;
}

.is-favorite {
  background-color: #ffd700;
  color: #000;
}


  
</style>

<body style="padding: 7px 11px; border: 200px solid; border-top: 59px solid; border-color: #e0dddd;">
  <table class='table is-striped' style='width: 100%;' margin="150px">
  `;
  filteredHTML +=
    '<tr><th style="width: 500px; text-align">Address</th><th>Publication Date</th><th>Category</th><th>Link</th></tr>';

  let properties = [];
  let propertySet = new Set();
  let addressesAdded = new Set(); // Nuevo Set para llevar un registro de las direcciones agregadas

  const promises = messages.map(message => getMessage(auth, "me", message.id));
  const datas = await Promise.all(promises);

  for (let i = 0; i < messages.length; i++) {
    console.log(` - ${messages[i].id}`);
    const data = datas[i];
    let $ = decodeAndLoadData(data);

    $("table").each(function (i, table) {
      let property = {};

      let link = $(table).find("a").attr("href");
      property.link = link || "#";

      let address = $(table)
        .find(
          "span[style='display: block; font-size: 13px; color: #4d4d4d; line-height: 1.23; font-weight: bold; text-decoration: none;']"
        )
        .text()
        .trim();
      property.address = address || "No address found";

      let publicationText = $(table).find("span:contains('Publicado')").text();
      let publicationDateRegex = /Publicado(\d{2}\/\d{2}\/\d{2})/;
      let matched = publicationText.match(publicationDateRegex);

      console.log("publicationText", publicationText);
      console.log("matched", matched);

      let publicationDate = "No publication date found";
      if (matched && matched[1]) {
        const date = moment(matched[1], "DD/MM/YY");
        console.log("date", date);
        if (date.isValid()) {
          publicationDate = date;
        }
      }

      property.publicationDate = publicationDate;

      let category = $(table)
        .find("span:contains(' - ')")
        .first()
        .text()
        .trim();
      property.category = category || "No category found";

      if (property.address !== "No address found" && property.link !== "#") {
        let propertyString = JSON.stringify(property);
        if (!propertySet.has(propertyString)) {
          properties.push(property);
          propertySet.add(propertyString);
        }
      }
    });
  }

  properties.sort((a, b) => b.publicationDate - a.publicationDate);

  properties.forEach(property => {
    if (isDateValid(property.publicationDate)) {
      property.publicationDate = property.publicationDate
        ? property.publicationDate.format("D MMMM") +
          " (hace " +
          moment().to(property.publicationDate) +
          ")"
        : "No publication date found";
    } else {
      property.publicationDate = "Invalid date";
    }

    if (
      isAddressNew(property.address, addressesAdded) &&
      isCategoryMatch(property.category, "Casa - ")
    ) {
      const visited = visitedProperties.includes(property.address);
      filteredHTML += createHTMLRow(property, visited);

      const favorite = favoriteProperties.includes(property.address);
      filteredHTML += createHTMLRow(property, visited, favorite);

      addressesAdded.add(property.address);
    }
  });

  filteredHTML += `
  </table>
  </body>
  </html>
  `;

  return filteredHTML;
}
function createHTMLRow(property, visited, favorite) {
  const rowClass = visited ? "is-visited" : "";
  const favClass = favorite ? "is-favorite" : ""; // Clase CSS para los favoritos
  const encodedAddress = encodeURIComponent(property.address);
  const encodedLink = encodeURIComponent(property.link);
  return `<tr class="${rowClass} ${favClass}">
    <td style='overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 500px;'>${property.address}</td>
    <td>${property.publicationDate}</td>
    <td>${property.category}</td>
    <td><a href="/visit?address=${encodedAddress}&link=${encodedLink}" class="button is-link is-light">Link</a> 
        <a href="/favorite?address=${encodedAddress}&link=${encodedLink}" class="button is-warning is-light">Favorito</a></td>
  </tr>`;
}

function markAsFavorite(address) {
  if (!favoriteProperties.includes(address)) {
    favoriteProperties.push(address);
    fs.writeFileSync(
      "favoriteProperties.json",
      JSON.stringify(favoriteProperties),
      "utf8"
    );
  }
}

function markAsVisited(address) {
  if (!visitedProperties.includes(address)) {
    visitedProperties.push(address);
    fs.writeFileSync(
      "visitedProperties.json",
      JSON.stringify(visitedProperties),
      "utf8"
    );
  }
}

function isDateValid(date) {
  return typeof date !== "string";
}

function isAddressNew(address, addressSet) {
  return !addressSet.has(address);
}

function isCategoryMatch(category, pattern) {
  return category.startsWith(pattern);
}

function decodeAndLoadData(data) {
  const decodedData = atob(data.replace(/-/g, "+").replace(/_/g, "/"));
  return cheerio.load(decodedData);
}

module.exports = {
  processMessages,
  markAsVisited,
  markAsFavorite,
};

// const atob = require("atob");
// const cheerio = require("cheerio");
// const { getMessage } = require("./gmail");
// const moment = require("moment");
// const axios = require("axios");
// const util = require("util");

// const fs = require("fs");

// moment.locale("es");

// let visitedProperties = [];
// try {
//   const data = fs.readFileSync("visitedProperties.json", "utf8");
//   visitedProperties = JSON.parse(data);
// } catch (err) {
//   console.error(err);
// }

// let favoriteProperties = [];
// try {
//   const data = fs.readFileSync("favoriteProperties.json", "utf8");
//   favoriteProperties = JSON.parse(data);
// } catch (err) {
//   console.error(err);
// }

// async function processMessages(auth, messages) {
//   let filteredHTML = `
//   <!DOCTYPE html>
// <html>
// <head>
//     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.3/css/bulma.min.css">
// </head>
// <style>
// .is-visited {
//   background: linear-gradient(to right, #eee, #ddd);
//   color: #666;
// }

// </style>

// <body style="padding: 7px 11px; border: 200px solid; border-top: 59px solid; border-color: #e0dddd;">
//   <table class='table is-striped' style='width: 100%;' margin="150px">
//   `;
//   filteredHTML +=
//     '<tr><th style="width: 500px; text-align">Address</th><th>Publication Date</th><th>Category</th><th>Link</th></tr>';

//   let properties = [];
//   let propertySet = new Set();
//   let addressesAdded = new Set(); // Nuevo Set para llevar un registro de las direcciones agregadas

//   const promises = messages.map(message => getMessage(auth, "me", message.id));
//   const datas = await Promise.all(promises);

//   for (let i = 0; i < messages.length; i++) {
//     console.log(` - ${messages[i].id}`);
//     const data = datas[i];
//     let $ = decodeAndLoadData(data);

//     $("table").each(function (i, table) {
//       let property = {};

//       let link = $(table).find("a").attr("href");
//       property.link = link || "#";

//       let address = $(table)
//         .find(
//           "span[style='display: block; font-size: 13px; color: #4d4d4d; line-height: 1.23; font-weight: bold; text-decoration: none;']"
//         )
//         .text()
//         .trim();
//       property.address = address || "No address found";

//       let publicationText = $(table).find("span:contains('Publicado')").text();
//       let publicationDateRegex = /Publicado(\d{2}\/\d{2}\/\d{2})/;
//       let matched = publicationText.match(publicationDateRegex);

//       console.log("publicationText", publicationText);
//       console.log("matched", matched);

//       let publicationDate = "No publication date found";
//       if (matched && matched[1]) {
//         const date = moment(matched[1], "DD/MM/YY");
//         console.log("date", date);
//         if (date.isValid()) {
//           publicationDate = date;
//         }
//       }

//       property.publicationDate = publicationDate;

//       let category = $(table)
//         .find("span:contains(' - ')")
//         .first()
//         .text()
//         .trim();
//       property.category = category || "No category found";

//       if (property.address !== "No address found" && property.link !== "#") {
//         let propertyString = JSON.stringify(property);
//         if (!propertySet.has(propertyString)) {
//           properties.push(property);
//           propertySet.add(propertyString);
//         }
//       }
//     });
//   }

//   properties.sort((a, b) => b.publicationDate - a.publicationDate);

//   properties.forEach(property => {
//     if (isDateValid(property.publicationDate)) {
//       property.publicationDate = property.publicationDate
//         ? property.publicationDate.format("D MMMM") +
//           " (hace " +
//           moment().to(property.publicationDate) +
//           ")"
//         : "No publication date found";
//     } else {
//       property.publicationDate = "Invalid date";
//     }

//     if (
//       isAddressNew(property.address, addressesAdded) &&
//       isCategoryMatch(property.category, "Casa - ")
//     ) {
//       const visited = visitedProperties.includes(property.address);
//       console.log("visited", visited);
//       filteredHTML += createHTMLRow(property, visited);
//       addressesAdded.add(property.address);
//     }
//   });

//   filteredHTML += `
//   </table>
//   </body>
//   </html>
//   `;

//   return filteredHTML;
// }
// function createHTMLRow(property, visited) {
//   const rowClass = visited ? "is-visited" : "";
//   console.log("rowClass", rowClass);
//   const encodedAddress = encodeURIComponent(property.address);
//   const encodedLink = encodeURIComponent(property.link);
//   return `<tr class="${rowClass}">
//     <td style='overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 500px;'>${property.address}</td>
//     <td>${property.publicationDate}</td>
//     <td>${property.category}</td>
//     <td><a href="/visit?address=${encodedAddress}&link=${encodedLink}" class="button is-link is-light">Link</a></td>
//   </tr>`;
// }

// function markAsVisited(address) {
//   if (!visitedProperties.includes(address)) {
//     visitedProperties.push(address);
//     fs.writeFileSync(
//       "visitedProperties.json",
//       JSON.stringify(visitedProperties),
//       "utf8"
//     );
//   }
// }

// function isDateValid(date) {
//   return typeof date !== "string";
// }

// function isAddressNew(address, addressSet) {
//   return !addressSet.has(address);
// }

// function isCategoryMatch(category, pattern) {
//   return category.startsWith(pattern);
// }

// function decodeAndLoadData(data) {
//   const decodedData = atob(data.replace(/-/g, "+").replace(/_/g, "/"));
//   return cheerio.load(decodedData);
// }

// module.exports = {
//   processMessages,
//   markAsVisited,
// };
