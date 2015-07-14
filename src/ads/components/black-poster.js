/**
 * The component that shows a black screen until the ads plugin has decided if it can or it can not play the ad.
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.BlackPoster = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);

    var posterImg = player.getChild('posterImage');

    //We need to do it asynchronously to be sure that the black poster el is on the dom.
    setTimeout(function() {
      if(posterImg) {
        player.el().insertBefore(this.el(), posterImg.el());
      }
    }.bind(this), 0);
  }
});

/**
 * Create the black poster div element
 * @return {Element}
 */
vjs.BlackPoster.prototype.createEl = function(){
  return vjs.createEl('div', {
    className: 'vjs-black-poster',
  });
};