
var util = require('util');


function NotAuthorisedError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || 'You are not authorised to access this resource.';
  this.code = '1005';
  this.status = '403';
}

util.inherits(NotAuthorisedError, Error);
