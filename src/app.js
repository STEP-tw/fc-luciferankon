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

const serveFile = function(req, res) {
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
};

const writeCommentToFile = function(comment,req, res) {
  fs.appendFile(
    "./metadata/comments.json_part",
    JSON.stringify(comment) + ",",
    err => {
      if (err) throw err;
      render(req, res);
    }
  );
};

const readArgs = text => {
  let args = {};
  const splitKeyValue = pair => pair.split("=");
  const assignKeyValueToArgs = ([key, value]) =>
    (args[key] = value.replace("+", " "));
  text
    .split("&")
    .map(splitKeyValue)
    .forEach(assignKeyValueToArgs);
  return args;
};

const readPostData = (req, res, next) => {
  let content = "";
  req.on("data", chunk => (content += chunk));
  req.on("end", () => {
    req.body = content;
    next();
  });
};

const postComment = function(req, res) {
  const commentData = readArgs(req.body);
  const date = new Date().toLocaleString();
  commentData.date = date;
  writeCommentToFile(commentData, req, res);
};

const render = function(req, res) {
  fs.readFile("metadata/comments.json_part", (err, data) => {
    const commentsData = JSON.parse("[" + data.slice(0, -1) + "]");
    let upperPart = "";
    fs.readFile("public_html/guest_book.html", (err, data) => {
      if (err) throw err;
      upperPart += data;
      send(res, upperPart + JSON.stringify(commentsData), 200);
    });
  });
};

app.use(logRequest);
app.use(readPostData);
// app.get("/", serveFile);
app.post("/guest_book", postComment);
app.get("/guest_book", render);
app.use(serveFile);
// Export a function that can act as a handler

module.exports = app.handleRequest.bind(app);
