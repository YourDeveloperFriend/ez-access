
import axios from 'axios';

export default class EZRoutes {
  constructor(options = {}) {
    this.options = options;
    this.pendingRequests = [];
  }
  addController(modelName, routes) {
    this[modelName] = _.mapValues(routes, (routeDetails, routeName)=> {
      return (...args)=> {
        return this._handleRequest(modelName, routeName, routeDetails, args);
      };
    });
  }
  _handleRequest(modelName, routeName, routeDetails, args) {
    let data = this._extractData(routeDetails.args, args);
    let path = this._constructPath(modelName, routeName, data);
    let method = routeDetails.method || this._getMethod(routeName) || 'get';
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
  _serialize(data, prefix) {
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
  _getMethod(routeName) {
    return _.find(['get', 'put', 'post', 'delete'], (method)=> {
      return routeName.indexOf(method) === 0;
    });
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
  _constructPath(modelName, routeName, data) {
    let pattern = this._getPattern(modelName, routeName, routeDetails);
    return pattern.replace(/(\/:[^\/]*?)(?=($|\/))/g, (text)=> {
      return '/' + data[text.substring(2)];
    });
  }
  _getPattern(modelName, routeName, routeDetails) {
    let pattern;
    if(pattern = routeDetails.pattern) {
      return pattern;
    }
    let modelPath = '/' + _.kebabCase(modelName);
    let endpoint = '';
    switch(routeName) {
      case 'query':
      case 'add':
      case 'create':
      case 'post':
      case 'batchDelete':
        break;
      case 'batchCreate':
      case 'batchAdd':
      case 'batchPost':
      case 'delete':
        endpoint = '/create';
        break;
      case 'get':
      case 'save':
      case 'update':
      case 'put':
        endpoint = '/:id';
        break;
      case 'batchSave':
      case 'batchUpdate':
      case 'batchPut':
        endpoint = '/update';
        break;
      default:
        let method = this._getMethod(routeName);
        if(method) {
          routeName = routeName.substring(method.length);
        }
        endpoint = '/' + _.kebabCase(routeName);
        if(routeDetails.usesId) {
          endpoint = '/:id' + endpoint;
        }
    }
    return modelPath + endpoint;
  }
}
