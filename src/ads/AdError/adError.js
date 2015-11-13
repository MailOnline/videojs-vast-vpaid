function AdError(message, code) {
  this.message = 'Ad Error: ' + (message || '');
  if (code) {
    this.code = code;
  }
}

AdError.prototype = new Error();
AdError.prototype.name = "Ad Error";