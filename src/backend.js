
import _ from 'lodash';

export default class BackendAccess {
  constructor(expressHandler) {
    this.expressHandler = expressHandler;
  }
  getAccessor(req, res) {
    return _.mapValues(this.expressHandler.controllers, (Controller)=> {
      return _.mapValues(Controller.getAllRoutes('express'), (value, key)=> {
        return function(...args) {
          let controller = new Controller(key);
          controller.overrideData = args;
          return controller.runExpressRoute(this.request, this.response);
        };
      });
    });
  }
}

