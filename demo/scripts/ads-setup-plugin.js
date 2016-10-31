const _ = require('./utils');
const messages = require('./messages');

module.exports = function molVastSetup (opts) {
  let pluginSettings;
  const player = this;
  const options = _.extend({}, this.options_, opts);

  pluginSettings = {
    playAdAlways: true,
    adCancelTimeout: options.adCancelTimeout || 3000,
    adsEnabled: Boolean(options.adsEnabled),
    vpaidFlashLoaderPath: '/VPAIDFlash.swf'
  };

  if (options.adTag) {
    pluginSettings.adTag = options.adTag;
  }

  if (options.adTagXML) {
    pluginSettings.adTagXML = options.adTagXML;
  }

  const vastAd = player.vastClient(pluginSettings);

  player.on('reset', () => {
    if (player.options().plugins['ads-setup'].adsEnabled) {
      vastAd.enable();
    } else {
      vastAd.disable();
    }
  });

  player.on('vast.aderror', (evt) => {
    const error = evt.error;

    if (error && error.message) {
      messages.error(error.message);
    }
  });
};
