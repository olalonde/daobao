/**
 * @param {Object} contollers is an hash of constructor classes that respond to .action(actionName) when instantiated
 */
var Dispatcher = module.exports.Dispatcher = function (controllers) {
  if (controllers instanceOf Array)
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

//@todo: namespaces
Dispatcher.prototype.assignHandler_ = function (namespace, controller, action) {
  console.log('Assigning handler to route %s%s#%s', (namespace ? namespace + "." : ''), controller, action);
  return handler.bind(this);
}

function handler(req, res, next) {
    var generic = false;
    // Generic routing does not provide a controller name (i.e. map.all(':controller/:action');)
    if (!controller) {
      generic = true;
      controller = req.params.controller;
      action = req.params.action;
    }
    // Set default action if none is set
    action = action ? action : this.defaultAction;

    // Make first letter uppercase (users -> Users)
    controller = controller.substring(0,1).toUpperCase() + controller.substring(1);

    // If we cannot find the controller
    if (!(typeof this.controllers[controller] !== 'function')) {
      // ... for generic routing, go to next handler as Express expects
      if (generic) return next();
      // ... for specific routing, pass an error
      else return next(new Error('Cannot find controller %s.', controller));
    }
    // Create controller
    var ctl = new this.controllers[controller](req, res, next);
    // Call action
    try {
      ctl.action(action);
    }
    catch (e) {
      // Oops, maybe action does not exist?
      next(e);
    }
  }

