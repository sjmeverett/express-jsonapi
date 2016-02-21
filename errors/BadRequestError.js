
var util = require('util');


function BadRequestError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || '';
  this.code = '1003';
  this.status = '400';
}

util.inherits(BadRequestError, Error);
