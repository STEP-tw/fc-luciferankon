const fs = require("fs");
const Express = require("./express");
const app = new Express();

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

const renderPage = function(req, res) {
  const requestedFile = getRequestedFile(req.url);
  fs.readFile(requestedFile, (err, data) => {
    try {
      send(res, data, 200);
    } catch (error) {
      if (err.code == "ENOENT") {
        send(res, "FILE_NOT_FOUND", 404);
        return;
      }
      send(res, "SERVER_INTERNAL_ERROR", 500);
    }
  });
};

const logRequest = (req, res, next) => {
  console.log(req.method, req.url);
  next();
}

const renderDependencies = function(req,res, next){
  renderPage(req, res);
  next();
}

app.use(logRequest);
app.get("/", renderPage);
app.use(renderDependencies);
// Export a function that can act as a handler

module.exports = app.handleRequest.bind(app);
