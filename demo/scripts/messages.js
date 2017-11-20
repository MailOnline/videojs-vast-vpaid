let timeoutId;
const dom = require('./miniDom');
const _ = require('./utils');

const MESSAGE_DURATION = 3500;
const MSG_TYPE = {
  SUCCESS: 'msg-success',
  ERROR: 'msg-error'
};
const messageContainer = document.createElement('div');

timeoutId = null;

dom.onReady(() => {
  document.body.appendChild(messageContainer);
});

dom.addClass(messageContainer, 'messages');

function showMessage (type, msg) {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  dom.addClass(messageContainer, MSG_TYPE[type]);
  messageContainer.innerHTML = msg;

  timeoutId = setTimeout(resetMessageContainer, MESSAGE_DURATION);
}

function resetMessageContainer () {
  _.forEach(MSG_TYPE, (className) => {
    dom.removeClass(messageContainer, className);
  });
  messageContainer.innerHTML = '';
  timeoutId = null;
}

function showSuccessMessage (msg) {
  showMessage('SUCCESS', msg);
}

function showErrorMessage (msg) {
  showMessage('ERROR', msg);
}

module.exports = {
  success: showSuccessMessage,
  error: showErrorMessage
};
