const fs = require("fs");
const Express = require("./express");
const decodingKeys = require("./decodingKeys.json");
const ERROR_404 = "404: Resource Not Found";
const ERROR_500 = "500: Internal Server Error";
const COMMENTS_PLACEHOLDER = "######COMMENTS_GOES_HERE######";

const app = new Express();
let commentsFileContent;
const redirectHome = { "./public_html/": "./public_html/index.html" };

const getRequestedFile = function(url) {
  const requestedFile = `./public_html${url}`;
  return redirectHome[requestedFile] || requestedFile;
};

const readCommentFile = function(req, res, next) {
  if (!fs.existsSync('private/comments.json')) {
    fs.writeFileSync('private/comments.json', "[]", "utf-8");
  }
  commentsFileContent = JSON.parse(
    fs.readFileSync("private/comments.json", "utf-8")
  );
  next();
};

const send = function(res, data, statusCode) {
  res.statusCode = statusCode;
  res.write(data);
  res.end();
};

const isFileNotFound = function(errorCode) {
  return errorCode == "ENOENT";
};

const serveFile = function(req, res) {
  const requestedFile = getRequestedFile(req.url);
  fs.readFile(requestedFile, (err, data) => {
    try {
      send(res, data, 200);
    } catch (error) {
      if (isFileNotFound(err.code)) {
        send(res, ERROR_404, 404);
        return;
      }
      send(res, ERROR_500, 500);
    }
  });
};

const logRequest = (req, res, next) => {
  console.log(req.method, req.url);
  next();
};

const saveComment = function(comment, req, res) {
  commentsFileContent.push(comment);
  fs.writeFile(
    "./private/comments.json",
    JSON.stringify(commentsFileContent),
    err => {
      if (err) throw err;
      serveGuestBookPage(req, res);
    }
  );
};

const decodeText = content => {
  let result = content;
  Object.keys(decodingKeys).forEach(x => {
    result = result.replace(new RegExp(`\\${x}`, "g"), decodingKeys[x]);
  });
  return result;
};

const readArgs = text => {
  let args = {};
  const splitKeyValue = pair => pair.split("=");
  const assignKeyValueToArgs = ([key, value]) => (args[key] = value);
  text
    .split("&")
    .map(splitKeyValue)
    .forEach(assignKeyValueToArgs);
  return args;
};

const readPostBody = (req, res, next) => {
  let content = "";
  req.on("data", chunk => (content += chunk));
  req.on("end", () => {
    req.body = content;
    next();
  });
};

const postComment = function(req, res) {
  let commentData = decodeText(req.body);
  commentData = readArgs(commentData);
  const date = new Date().toLocaleString();
  commentData.date = date;
  saveComment(commentData, req, res);
};

const createCommentsHTML = function(commentsData) {
  const commentsHTML = commentsData.map(({ date, name, comment }) => {
    return `<p>${date}: <strong>${name}</strong> : ${comment}</p>`;
  });
  return commentsHTML.reverse().join("\n");
};

const displayComments = function(res, commentsData, guestBookHTML) {
  const commentsHTML = createCommentsHTML(commentsData);
  const guestBookPage = guestBookHTML
    .toString()
    .replace(COMMENTS_PLACEHOLDER, commentsHTML);
  send(res, guestBookPage, 200);
};

const serveGuestBookPage = function(req, res) {
  const commentsData = commentsFileContent;
  fs.readFile("private/guest_book.html", (err, data) => {
    if (err) return send(res, ERROR_500, 500);
    displayComments(res, commentsData, data);
  });
};

const updateComments = function(req, res) {
  send(res, JSON.stringify(commentsFileContent), 200);
};

app.use(logRequest);
app.use(readPostBody);
app.use(readCommentFile);
app.post("/guest_book", postComment);
app.get("/guest_book", serveGuestBookPage);
app.get("/Abeliophyllum.html", serveFile);
app.get("/Ageratum.html", serveFile);
app.get("/comments", updateComments);
app.use(serveFile);
// Export a function that can act as a handler

module.exports = app.handleRequest.bind(app);
