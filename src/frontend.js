
import axios from 'axios';

let dataMethods = ['put', 'post'];

let defaultOptions = {
  baseRoute: ''
};

export default class EZRoutes {
  constructor(options) {
    this.options = _.extend({}, defaultOptions, options);
    this.pendingRequests = [];
  }
  addController(modelName, routes) {
    let tableName = routes.tableName;
    this[modelName] = _.mapValues(routes, (routeDetails, routeName)=> {
      return (...args)=> {
        return this._handleRequest({tableName, modelName, routeName, routeDetails, args});
      };
    });
  }
  _handleRequest(options) {
    let data = this._extractData(options.routeDetails.args, options.args);
    let path = this._constructPath(options, data);
    let method = options.routeDetails.method;
    if(method === 'get') {
      path += this._constructQuery(data);
      data = null;
    }
    this._makeRequest(method, path, data);
  }
  _constructQuery(data) {
    let query = this._serialize(data);
    if(query.length > 0) {
      return '?' + query;
    }
    return '';
  }
  _serialize(obj, prefix) {
    let str = [];
    if(obj) {
      return _.map(obj, (val, key)=> {
        if(_.isUndefined(val)) {
          return '';
        } else {
          if(prefix)
            key = `${prefix}[${key}]`;
          if(typeof val === 'object') {
            return this.serialize(val, key);
          } else {
            return key + '=' + encodeURIComponent(val);
          }
        }
      }).join('&');
    }
    return '';
  }
  _makeRequest(method, path, data) {
    let promise;
    if(-1 !== dataMethods.indexOf(method)) {
      promise = axios[method](path, data, this.options.requestConfig);
    } else {
      promise = axios[method](path, this.options.requestConfig);
    }
    return promise.then( (result)=> {
      if(result.status < 400) {
        return result.data;
      } else {
        let error = new Error(result.data.error);
        error.errors = result.data.errors;
        throw error;
      }
    });
  }
  _extractData(argList, args) {
    return _.reduce(argList, (data, argName, i)=> {
      let argVal = args[i];
      if(argName === '_data') {
        data = _.reduce(argVal, (data, val, key)=> {
          data[key] = val;
          return data;
        }, data);
      } else {
        data[argName] = argVal;
      }
      return data;
    }, {});
  }
  _constructPath(options, data) {
    let path = options.routeDetails.pathPattern.replace(/(\/:[^\/]*?)(?=($|\/))/g, (text)=> {
      let variableName = text.substring(2);
      variableName = variableName.replace(/\(.*?\)/g, '');
      return '/' + data[variableName];
    });
    return this.options.baseRoute + path;
  }
}
