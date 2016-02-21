
var util = require('util');


function NotFoundError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || 'Resource not found';
  this.code = '1001';
  this.status = '404';
}

util.inherits(NotFoundError, Error);
