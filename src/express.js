/**
 * Checks request and route are same or not
 * @param {Object} req - requested URL
 * @param {Object} route - one of the routes to the server
 */

const isMatching = (req, route) => {
  if (route.method && req.method != route.method) return false;
  if (route.url instanceof RegExp && route.url.test(req.url)) return true;
  if (route.url && req.url != route.url) return false;
  return true;
};

class Express {
  /**
   * @constructor
   */
  constructor() {
    this.routes = [];
  }
  /**
   * request coming to the server
   * @param {Object} req - request from the client
   * @param {Object} res - response given from the server
   */
  handleRequest(req, res) {
    let matchingRoutes = this.routes.filter(r => isMatching(req, r));
    let remaining = [...matchingRoutes];

    let next = () => {
      let current = remaining[0];
      if (!current) return;
      remaining = remaining.slice(1);
      current.handler(req, res, next);
    };
    next();
  }
  /**
   * push the handler in the routes
   * @param {Callback} handler handler for the request
   */
  use(handler) {
    this.routes.push({ handler });
  }
  /**
   * push the path in the routes with the handler and GET method
   * @param {String} url route to the server for post method
   * @param {Callback} handler handler for the request
   */
  get(url, handler) {
    this.routes.push({ method: "GET", url, handler });
  }
  /**
   * push the path in the routes with the handler and POST method
   * @param {String} url route to the server for post method
   * @param {Callback} handler handler for the request
   */
  post(url, handler) {
    this.routes.push({ method: "POST", url, handler });
  }
}
/**  Exports the Express class */
module.exports = Express;
