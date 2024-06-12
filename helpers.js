const { ENDPOINT } = require("./constants");

const getHTMLText = (title, body) => `<html>
<head>
  <title>${title ?? "Hello from Server"}</title>
</head>
  <body>${
    body ??
    `<form action="${ENDPOINT.ADMIN}/${ENDPOINT.ADD_PRODUCT}" method="POST"><input type="text" name="product" /><button type="submit">Submit</button></form>`
  }</body>
</html>`;

module.exports = { getHTMLText };
