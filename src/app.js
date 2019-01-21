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
const COMMENTS_PLACEHOLDER = "######COMMENTS_GOES_HERE######";
const COMMENTS_FILE = "private/comments.json";
const REDIRECT_HOME = { "./public_html/": "./public_html/index.html" };

const app = new Express();
/** comments storage */
let commentsFileContent;

/**
 * @function getRequestedFile - get file path
 * @param {String} url - requested URL
 * @returns {String} - file path
 */
const getRequestedFile = function(url) {
  const requestedFile = `./public_html${url}`;
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
  commentsFileContent = JSON.parse(fs.readFileSync(COMMENTS_FILE, "utf-8"));
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
  commentsFileContent.push(comment);
  fs.writeFile(
    "./" + COMMENTS_FILE,
    JSON.stringify(commentsFileContent),
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
  commentData = readArgs(commentData);
  const date = new Date().toLocaleString();
  commentData.date = date;
  saveComment(commentData, req, res);
};

/**
 * @function createCommentsHTML - create HTML from JSON Object
 * @param {Object} commentsData - JSON file of the comments
 * @returns {String} - the HTML content for comments section
 */

const createCommentsHTML = function(commentsData) {
  const commentsHTML = commentsData.map(({ date, name, comment }) => {
    return `<p>${date}: <strong>${name}</strong> : ${comment}</p>`;
  });
  return commentsHTML.reverse().join("\n");
};

/**
 * @function displayComments - display the comments in the page
 * @param {Object} res - response from server
 * @param {Object} commentsData - JSON object of the comments
 * @param {String} guestBookHTML - HTML of the page Guest_Book
 */

const displayComments = function(res, commentsData, guestBookHTML) {
  const commentsHTML = createCommentsHTML(commentsData);
  const guestBookPage = guestBookHTML
    .toString()
    .replace(COMMENTS_PLACEHOLDER, commentsHTML);
  send(res, guestBookPage, 200);
};

/**
 * @function serveGuestBookPage - serve the guest book page
 * @param {Object} req - request to server
 * @param {Object} res - response from server
 */

const serveGuestBookPage = function(req, res) {
  const commentsData = commentsFileContent;
  fs.readFile("private/guest_book.html", (err, data) => {
    if (err) return send(res, ERROR_500, 500);
    displayComments(res, commentsData, data);
  });
};

/**
 * @function updateComments - update the comments section
 * @param {Object} req - request to server
 * @param {Object} res - response from server
 */

const updateComments = function(req, res) {
  send(res, createCommentsHTML(commentsFileContent), 200);
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
