
import _ from 'lodash';

export default class BackendAccess {
  constructor(expressHandler) {
    this.expressHandler = expressHandler;
  }
  getAccessor(req, res) {
    return _.mapValues(this.expressHandler.controllers, (Controller)=> {
      return _.mapValues(Controller.getAllRoutes('express'), (value, key)=> {
        return async function(...args) {
          let controller = new Controller(key);
          controller.overrideData = args;
          let result = await controller.runExpressRoute(this.request, this.response);
          if(result.success) {
            return result.result;
          } else {
            throw result.error;
          };
        };
      });
    });
  }
}

