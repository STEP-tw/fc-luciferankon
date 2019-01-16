const fs = require("fs");

const redirectHome = { './': './index.html' };

const getRequestedFile = function(url){
  const requestedFile = `.${url}`;
  return redirectHome[requestedFile] || requestedFile;
}

const send = function(res, data, statusCode){
  res.statusCode = statusCode;
  res.write(data);
  res.end();
}

const app = (req, res) => {
  const requestedFile = getRequestedFile(req.url);
  
  fs.readFile(requestedFile, (err, data) => {
    if(!err){ 
      send(res, data, 200); 
      return; 
    }
    if(err.code == 'ENOENT'){
      send(res, 'FILE_NOT_FOUND', 404);
      return;
    }
    send(res, 'SERVER_INTERNAL_ERROR', 500);
  });
};

// Export a function that can act as a handler

module.exports = app;
