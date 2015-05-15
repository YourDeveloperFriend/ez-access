
import _ from 'lodash';

export default class BackendAccess {
  constructor(expressHandler) {
    this.expressHandler = expressHandler;
  }
  getAccessor(req, res) {
    return _.mapValues(this.expressHandler.controllers, (Controller)=> {
      return _.reduce(Controller.getAllRoutes('express'), (obj, value, key)=> {
        Object.defineProperty(obj, key, {
          get: function(...args) {
            let controller = new Controller(key);
            controller.overrideData = args;
            return controller.runExpressRoute(this.request, this.response);
          }
        });
        return obj;
      }, {});
    });
  }
}

