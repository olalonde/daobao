var jsonpath = require('JSONPath');

/**
 * @param {Object} contollers is an hash of constructor classes that respond to .action(actionName) when instantiated
 */
var Dispatcher = module.exports.Dispatcher = function (controllers) {
  if (controllers instanceof Array)
    throw new Error('Controllers must be an array of controllers.');
  this.controllers = controllers;
}

Dispatcher.prototype.defaultAction = 'index';

/**
 * Utility function to make sure our assignHandler is bound to this
 * when passed to railway-routes.
 */
Dispatcher.prototype.assignHandler = function () {
  return this.assignHandler_.bind(this);
}

/**
 * Utility function to automatically create a dispatcher object and return its
 * assignHandler.
 */
module.exports.assignHandler = function (controllers) {
  return (new Dispatcher(controllers)).assignHandler();
}

Dispatcher.prototype.getController = function (namespace, controllerName) {
  var Controller, path;
  if (namespace) {
    // # parse namespace
    // remove trailing /
    path = namespace.split('/');
    if (path[path.length - 1].trim() == '') path.pop();
    // replace / by . and append .controllerName
    path.forEach(function(ele, index) {
      // Uppercase first letter ofnamespaces
      path[index] = ele.charAt(0).toUpperCase() + ele.substr(1);
    });
    path = path.join('.') + '.' + controllerName;
  }
  else {
    path = controllerName;
  }

  Controller = jsonpath.eval(this.controllers, path);

  if (Controller) {
    Controller = Controller[0];
  }

  if (Controller && (typeof Controller === 'function')) {
    return Controller;
  }
  throw new Error('Could not find controller.');
}

//@todo: namespaces
Dispatcher.prototype.assignHandler_ = function (namespace, controller, action) {
  //console.log('Assigning handler to route %s%s#%s', (namespace ? namespace + "." : ''), controller, action);
  var self = this;
  return function handler(req, res, next) {
    var controllerName = controller;
    var actionName = action;

    var generic = false;
    // Generic routing does not provide a controller name (i.e. map.all(':controller/:action');)
    // so we have to get our controller and action from req parameters
    if (!controller) {
      generic = true;
      controllerName = req.params.controller;
      actionName = req.params.action;
    }

    //console.log(namespace);
    //console.log(controllerName);
    //console.log(actionName);
    //if(generic) console.log('Generic handling.');
    // Set default action if none is set
    actionName = actionName ? actionName : self.defaultAction;

    // Make first letter uppercase (users -> Users)
    controllerName = controllerName.substring(0,1).toUpperCase() + controllerName.substring(1);

    var Controller;
    try {
      Controller = self.getController(namespace, controllerName);
    }
    catch (e) {
      // ... for generic routing, go to next handler as Express expects
      if (generic)
        return next();
      // ... for specific routing, pass an error
      else
        return next(new Error('Cannot find controller ' + namespace + controllerName + ' in our controller list!'));
    }

    // make controller/action available to view
    res.locals.controller = controllerName.toLowerCase();
    res.locals.action = actionName.toLowerCase();

    // Create controller
    var ctl = new Controller(req, res, next);
    // Call action
    try {
      ctl.action(actionName);
    }
    catch (e) {
      if (e.name === 'ActionNotFoundError') {
        // could not find action!
        // no big deal... let's just go to our next middleware without
        // passing an error
        next();
      }
      else {
        next(e);
      }
    }
  };
}
