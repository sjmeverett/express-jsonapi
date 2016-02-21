
var util = require('util');


function ConflictError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || 'Conflict';
  this.code = '1002';
  this.status = '409';
}

util.inherits(ConflictError, Error);
