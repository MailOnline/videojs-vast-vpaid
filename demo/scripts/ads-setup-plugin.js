var AD_TAGS = {
  VAST: 'http://pubads.g.doubleclick.net/gampad/ads?env=vp&gdfp_req=1&impl=s&output=xml_vast3&unviewed_position_start=1&hl=en&iu=%2F5765%2Fdm.video%2Fdm_video_vasttest&correlator=1432047711631&cust_params=length%3D0%26videoWidth%3D308%26videoHeight%3D173%26play%3Dfirst%26embed%3Dfalse%26videoTitle%3DThe_girl_with_the_Dragon_tattoo%26asi%3D%26sz%3D308x173&description_url=http%3A%2F%2Fwww.dailymail.co.uk%2Ffemail%2Farticle-2937570%2FJennifer-Aniston-Jennifer-Lawrence-Kate-Hudson-lead-silicone-free-trend-proving-natural-silhouette-in.html%23v-3983661116001&url=http%3A%2F%2Fwww.dailymail.co.uk%2Ffemail%2Farticle-2937570%2FJennifer-Aniston-Jennifer-Lawrence-Kate-Hudson-lead-silicone-free-trend-proving-natural-silhouette-in.html%23v-3983661116001&scor=1432047711695&sz=308x173&ged=ta1_ve2_eb11_pt20.16.20_td20_tt1_pd1_bs10_tv1_is0_er2930.0.3288.636_sv2_sp1_vi2491.0.3775.534_vp84_ct1_vb1_vl1_vr0&vid=1234567',
  VPAID_EXPAND: 'http://cdn-tags.brainient.com/1228/cba8794a-38a5-448b-ad31-e3f6169645c1/vast.xml?platform=vpaid&v=v6&proto=http',
  VPAID_BUTTON: 'http://cdn-tags.brainient.com/1228/34f8e4e6-e83c-46da-8bf6-a37ae9ed5134/vast.xml?platform=vpaid&v=v6&proto=http'
};

window.AD_TAG = AD_TAGS.VPAID_EXPAND;

function selectBtn(btn, adTag) {
  unselectBtns();
  dom.addClass(btn, 'selected');
  window.AD_TAG = adTag;
}

function unselectBtns() {
  var btns = document.querySelectorAll('button.btn');
  var i, len;
  for (i = 0, len = btns.length; i < len; i += 1) {
    dom.removeClass(btns[i], 'selected');
  }
}

vjs.plugin('ads-setup', function molVastSetup(opts) {
  var player = this;
  var options = extend({}, this.options_, opts);
  var adsCancelTimeout = 3000;

  var vastAd = player.vast({
    url: getAdsUrl,
    playAdAlways: true,
    //Note: As requested we set the preroll timeout at the same place thant the adsCancelTimeout
    prerollTimeout: adsCancelTimeout,
    adCancelTimeout: adsCancelTimeout,
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
    return AD_TAG;
  }
});
