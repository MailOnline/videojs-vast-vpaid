var dom = require('./miniDom');
var _ = require('./utils');
var MESSAGE_DURATION = 3500;
var MSG_TYPE = {
  SUCCESS: 'msg-success',
  ERROR: 'msg-error'
};
var timeoutId = null;

var messageContainer = document.createElement('div');

dom.onReady(function() {
  document.body.appendChild(messageContainer);
});

dom.addClass(messageContainer, 'messages');

function showMessage(type, msg) {
  if(timeoutId){
    clearTimeout(timeoutId);
  }
  dom.addClass(messageContainer, MSG_TYPE[type]);
  messageContainer.innerHTML = msg;

  timeoutId = setTimeout(resetMessageContainer, MESSAGE_DURATION);
}

function resetMessageContainer() {
  _.forEach(MSG_TYPE, function(className) {
    dom.removeClass(messageContainer, className);
  });
  messageContainer.innerHTML = '';
  timeoutId = null;
}

function showSuccessMessage(msg) {
  showMessage('SUCCESS', msg);
}

function showErrorMessage(msg) {
  showMessage('ERROR', msg);
}

module.exports = {
  success: showSuccessMessage,
  error: showErrorMessage
};



