var vjsComponent = videojs.getComponent('Component');
var AdsLabel = videojs.extend(vjsComponent, {
  /** @constructor */
  constructor: function (player, options) {
    vjsComponent.call(this, player, options);

    var that = this;

    // We asynchronously reposition the ads label element
    setTimeout(function () {
      var currentTimeComp = player.controlBar &&( player.controlBar.getChild("timerControls") || player.controlBar.getChild("currentTimeDisplay") );
      if(currentTimeComp) {
        player.controlBar.el().insertBefore(that.el(), currentTimeComp.el());
      }
      dom.removeClass(that.el(), 'vjs-label-hidden');
    }, 0);
  }
});

AdsLabel.prototype.createEl = function(){
  return vjsComponent.prototype.createEl.call(this, 'div', {
    className: 'vjs-ads-label vjs-control vjs-label-hidden',
    innerHTML: 'Advertisement'
  });
};

videojs.registerComponent('AdsLabel', AdsLabel);