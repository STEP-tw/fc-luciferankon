/**
 * @requires module
 */

const fs = require("fs");
const Express = require("./express");
const decodingKeys = require("./decodingKeys.json");
/**
 * @constants
 */
const ERROR_404 = "404: Resource Not Found";
const ERROR_500 = "500: Internal Server Error";
const COMMENTS_FILE = "private/comments.json";
const COOKIES_FILE = "private/cookies.json";
const REDIRECT_HOME = { "./": "./index.html" };

const app = new Express();
/** comments storage */
let comments;
let cookies;
const cache = {};

const filesToRead = fs.readdirSync("./public_html");
filesToRead.forEach(fileName => {
  const content = fs.readFileSync("./public_html/" + fileName);
  cache["./" + fileName] = content;
});

/**
 * @function getRequestedFile - get file path
 * @param {String} url - requested URL
 * @returns {String} - file path
 */
const getRequestedFile = function(url) {
  const requestedFile = `.${url}`;
  return REDIRECT_HOME[requestedFile] || requestedFile;
};

/**
 * @function readCommentFile - reads the comments file
 * @param {Object} req request to server
 * @param {Object} res response from server
 * @param {Function} next - next functionality
 */

const readCommentFile = function(req, res, next) {
  if (!fs.existsSync(COMMENTS_FILE)) {
    fs.writeFileSync(COMMENTS_FILE, "[]", "utf-8");
  }
  comments = JSON.parse(fs.readFileSync(COMMENTS_FILE, "utf-8"));
  next();
};

const readCookiesFile = function(req, res, next) {
  if (!fs.existsSync(COOKIES_FILE)) {
    fs.writeFileSync(COOKIES_FILE, "[]", "utf-8");
  }
  cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, "utf-8"));
  next();
};

/**
 * @function send - sends the response
 * @param {Object} res -response from server
 * @param {String} data - response data
 * @param {Int} statusCode - status code of the response
 */

const send = function(res, data, statusCode) {
  res.statusCode = statusCode;
  res.write(data);
  res.end();
};

/**
 * @function isFileNotFound - checks file exists or not
 * @param {String} errorCode - error code
 * @returns {Boolean} - file is found or not
 */

const isFileNotFound = function(errorCode) {
  return errorCode == "ENOENT";
};

/**
 * @function serveFile - serve the file wanted
 * @param {Object} req - request to server
 * @param {Object} res - response from server
 */

const serveFile = function(req, res) {
  const requestedFile = getRequestedFile(req.url);
  const fileContent = cache[requestedFile];
  try {
    send(res, fileContent, 200);
  } catch (err) {
    if (isFileNotFound(err.code)) {
      send(res, ERROR_404, 404);
      return;
    }
    send(res, ERROR_500, 500);
  }
};

/**
 * @function logRequest - logs the request method and URL
 * @param {Object} req - request to server
 * @param {Obeject} res - response from server
 * @param {Function} next - next functionality
 */

const logRequest = (req, res, next) => {
  console.log(req.method, req.url);
  next();
};

/**
 * @function saveComment - writes the comments to comments file
 * @param {Object} comment - JSON object of the current comment
 * @param {Object} req - request to server
 * @param {Object} res - response from server
 */

const saveComment = function(comment, req, res) {
  comments.push(comment);
  fs.writeFile(
    "./" + COMMENTS_FILE,
    JSON.stringify(comments),
    err => {
      if (err) throw err;
      serveGuestBookPage(req, res);
    }
  );
};

/**
 * @function decodeText - decodes the given text
 * @param {String} content - string to decode
 * @returns {String} - decoded String
 */

const decodeText = content => {
  let result = content;
  Object.keys(decodingKeys).forEach(x => {
    result = result.replace(new RegExp(`\\${x}`, "g"), decodingKeys[x]);
  });
  return result;
};

/**
 * @function readArgs
 * @param {String} text - posted args
 * @returns {Object} - formatted args
 */

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

/**
 * @function readPostBody - read the data given in the post
 * @param {Object} req - request to server
 * @param {Object} res - response from server
 * @param {Function} next - next functionality
 */

const readPostBody = (req, res, next) => {
  let content = "";
  req.on("data", chunk => (content += chunk));
  req.on("end", () => {
    req.body = content;
    next();
  });
};

/**
 * @function postComment - handler for post request
 * @param {Object} req - request to server
 * @param {Object} res - response from server
 */

const postComment = function(req, res) {
  let commentData = decodeText(req.body);
  const cookie = req.headers['cookie'];
  const name = cookie.split('=')[1];
  commentData = readArgs(commentData);
  const date = new Date();
  commentData.name = name;
  commentData.date = date;
  saveComment(commentData, req, res);
};

const sendLoginPage = (req, res) => {
  fs.readFile("private/guest_book_login.html", (err, data) => {
    send(res, data, 200);
  });
};

const sendCommentPage = (req, res, cookie) => {
  const userName = cookie.split('=')[1];
  fs.readFile("private/guest_book.html", (err, data) => {
    const commentsPage = data.toString().replace('__NAME_HOLDER__',userName);
    send(res, commentsPage, 200);
  });
};

const checkCookies = (req, res) => {
  const cookie = req.headers["cookie"];

  if (!cookie) {
    sendLoginPage(req, res);
    return;
  }
  if (cookies.includes(cookie)) {
    sendCommentPage(req, res, cookie);
  }
};

/**
 * @function serveGuestBookPage - serve the guest book page
 * @param {Object} req - request to server
 * @param {Object} res - response from server
 */

const serveGuestBookPage = function(req, res) {
  checkCookies(req, res);
};

/**
 * @function updateComments - update the comments section
 * @param {Object} req - request to server
 * @param {Object} res - response from server
 */

const updateComments = function(req, res) {
  send(res, JSON.stringify(comments), 200);
};

const doNothing = () => {};

const readCookies = (req, res, name) => {
  const cookie = `userName=${name}`;
  res.setHeader("Set-Cookie", cookie);
  if (!cookies.includes(cookie)) {
    cookies.push(cookie);
    fs.writeFile("./private/cookies.json", JSON.stringify(cookies), doNothing);
  }
  sendCommentPage(req, res, cookie);
};

const handleLogout = function(req, res){
  const currentCookie = req.headers['cookie'];
  cookies = cookies.filter(cookie => cookie!=currentCookie);
  fs.writeFile('private/cookies.json', JSON.stringify(cookies), doNothing);
  res.setHeader('Set-Cookie','userName=;expires=Thu, 01 Jan 1970 00:00:01 GMT;');
  sendLoginPage(req, res);
}

const renderGuestBook = function(req, res) {
  const userName = req.body;
  readCookies(req, res, userName);
};

app.use(readCommentFile);
app.use(readCookiesFile);
app.use(logRequest);
app.use(readPostBody);
app.post("/guest_book", postComment);
app.get("/guest_book", serveGuestBookPage);
app.post("/guest_book_home", renderGuestBook);
app.post('/logout',handleLogout);
app.get("/Abeliophyllum.html", serveFile);
app.get("/Ageratum.html", serveFile);
app.get("/comments", updateComments);
app.use(serveFile);
// Export a function that can act as a handler

module.exports = app.handleRequest.bind(app);
