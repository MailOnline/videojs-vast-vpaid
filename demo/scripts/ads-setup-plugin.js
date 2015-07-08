var _ = require('./utils');

module.exports = function molVastSetup(opts) {
  var player = this;
  var options = _.extend({}, this.options_, opts);

  var vastAd = player.vastClient({
    url: getAdsUrl,
    playAdAlways: true,
    adCancelTimeout: options.adCancelTimeout || 3000,
    adsEnabled: !!options.adsEnabled
  });

  player.on('reset', function () {
    if (player.options().plugins['ads-setup'].adsEnabled) {
      vastAd.enable();
    } else {
      vastAd.disable();
    }
  });

  /**** Local functions ******/
  function getAdsUrl() {
    return options.adsTag;
  }
};
