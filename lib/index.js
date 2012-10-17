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
module.exports.assignHandler = function(controllers) {
  return (new Dispatcher(controllers)).assignHandler();
}

//@todo: namespaces
Dispatcher.prototype.assignHandler_ = function (namespace, controller, action) {
  console.log('Assigning handler to route %s%s#%s', (namespace ? namespace + "." : ''), controller, action);
  var self = this;
  return function handler(req, res, next) {
    console.log(controller + ' handler');
    var generic = false;
    // Generic routing does not provide a controller name (i.e. map.all(':controller/:action');)
    var controllerName = controller;
    var actionName = action;
    if (!controller) {
      generic = true;
      controllerName = req.params.controller;
      actionName = req.params.action;
    }
    if(generic) console.log('Generic handling.');
    // Set default action if none is set
    actionName = actionName ? actionName : self.defaultAction;

    // Make first letter uppercase (users -> Users)
    controllerName = controllerName.substring(0,1).toUpperCase() + controllerName.substring(1);

    console.log('Handling request ' + controllerName + '#' + actionName);

    // If we cannot find the controller
    if (!self.controllers[controllerName] || typeof self.controllers[controllerName] !== 'function') {
      // ... for generic routing, go to next handler as Express expects
      if (generic) return next();
      // ... for specific routing, pass an error
      else return next(new Error('Cannot find controller ' + controllerName + ' in our controller list!'));
    }
    // Create controller
    var ctl = new self.controllers[controllerName](req, res, next);
    // Call action
    try {
      ctl.action(actionName);
    }
    catch (e) {
      // Oops, maybe action does not exist?
      next(e);
    }
  };
}
