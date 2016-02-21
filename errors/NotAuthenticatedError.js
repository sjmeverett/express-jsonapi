
var util = require('util');


function NotAuthenticatedError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || 'You are not authenticated: please authenticate and try again.';
  this.code = '1004';
  this.status = '401';
}

util.inherits(NotAuthenticatedError, Error);
