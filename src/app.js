const fs = require("fs");

const redirectHome = { "./public_html/": "./public_html/index.html" };

const getRequestedFile = function(url) {
  const requestedFile = `./public_html${url}`;
  return redirectHome[requestedFile] || requestedFile;
};

const send = function(res, data, statusCode) {
  res.statusCode = statusCode;
  res.write(data);
  res.end();
};

const app = (req, res) => {
  const requestedFile = getRequestedFile(req.url);

  fs.readFile(requestedFile, (err, data) => {
    try {
      send(res, data, 200);
    } catch(error) {
      if (err.code == "ENOENT") {
        send(res, "FILE_NOT_FOUND", 404);
        return;
      }
      send(res, "SERVER_INTERNAL_ERROR", 500);
    }
  });
};

// Export a function that can act as a handler

module.exports = app;
