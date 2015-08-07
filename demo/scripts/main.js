var dom = require('./miniDom');
var adsSetupPlugin = require('./ads-setup-plugin');
var messages = require('./messages');
var custom_xhr = {};

xhook.before(function(request, callback) {
  var intercept_urls = Object.keys(custom_xhr);
  var i, len, match, intercept_url;

  for (i = 0, len = intercept_urls.length; i < len; i++) {
    intercept_url = intercept_urls[i];
    match = new RegExp(intercept_url + "$", "gi");
    if (request.url.match(match)) {
      return callback({
        status: 200,
        data: custom_xhr[intercept_url]
      });
    }
  }
  callback();
});

videojs.plugin('ads-setup', adsSetupPlugin);

dom.onReady(function() {
  var vastForm = document.querySelector('form#vast-form');
  var vpaidForm = document.querySelector('form#vpaid-form');

  initForm(vastForm);
  initForm(vpaidForm);

  /*** Local functions ***/
  function initForm(formEl) {
    var tagTypeEl = formEl.querySelector('input.tag-type-radio');
    var xmlTypeEl = formEl.querySelector('input.xml-type-radio');
    var customTypeEl = formEl.querySelector('input.custom-type-radio');
    var updateBtn = formEl.querySelector('.button.button-primary');
    var pauseBtn = formEl.querySelector('.pause');
    var resumeBtn = formEl.querySelector('.resume');
    var tagEl = formEl.querySelector('input.tag-el');
    var xmlEl = formEl.querySelector('select.xml-el');
    var customEl = formEl.querySelector('textarea.custom-el');
    var videoContainer = formEl.querySelector('div.vjs-video-container');
    var player;

    updateVisibility();
    dom.addEventListener(tagTypeEl, 'change', updateVisibility);
    dom.addEventListener(xmlTypeEl, 'change', updateVisibility);
    dom.addEventListener(customTypeEl, 'change', updateVisibility);
    dom.addEventListener(updateBtn, 'click', function() {
      updateDemo();
      messages.success("Demo updated!!!");
    });
    var pauseClicked = false;
    if (pauseBtn) {
      dom.addEventListener(pauseBtn, 'click', function() {
        pauseAd();
        messages.success("ad paused");
      });
    }
    if (resumeBtn) {
      dom.addEventListener(resumeBtn, 'click', function() {
        resumeAd();
        messages.success("ad resumed");
      });
    }

    updateDemo();

    /*** Local functions ***/
    function updateVisibility() {
      dom.removeClass(formEl, 'TAG');
      dom.removeClass(formEl, 'XML');
      dom.removeClass(formEl, 'CUSTOM');
      dom.addClass(formEl, activeMode());
    }

    function pauseAd() {
      if (player) {
        player.vast.adUnit.pauseAd();
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'inline-block';
      }
    }

    function resumeAd() {
      if (player) {
        player.vast.adUnit.resumeAd();
        pauseBtn.style.display = 'inline-block';
        resumeBtn.style.display = 'none';
      }
    }

    function updateDemo() {
      createVideoEl(videoContainer, function(videoEl) {
        var adsTag;
        var mode = activeMode();
        if (mode === 'TAG') {
          adsTag = tagEl.value;
        } else if (mode === 'XML') {
          adsTag = xmlEl.value;
        } else {
          adsTag = 'CUSTOM_AD_TAG' + new Date().getTime();
          custom_xhr[adsTag] = customEl.value;
        }

        player = videojs(videoEl, {
          "plugins": {
            "ads-setup": {
              "adCancelTimeout": 10000, // Wait for ten seconds before canceling the ad.
              "adsEnabled": true,
              "adsTag": adsTag
            }
          }
        });
        
        player.on('vast.adStart', function() {
          pauseBtn.style.display = 'inline-block';
        });

        player.on('vast.adEnd', function() {
          pauseBtn.style.display = 'none';
        });
      });
    }

    function activeMode() {
      if (tagTypeEl.checked) {
        return 'TAG';
      }

      if (xmlTypeEl.checked) {
        return 'XML';
      }

      return 'CUSTOM'
    }

    function createVideoEl(container, cb) {
      var videoTag = '<video class="video-js vjs-default-skin" controls preload="auto" poster="http://video-js.zencoder.com/oceans-clip.png" >' +
        '<source src="http://video-js.zencoder.com/oceans-clip.mp4" type="video/mp4"/>' +
        '<source src="http://video-js.zencoder.com/oceans-clip.webm" type="video/webm"/>' +
        '<source src="http://video-js.zencoder.com/oceans-clip.ogv" type="video/ogg"/>' +
        '<p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that ' +
        '<a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>' +
        '</p>' +
        '</video>';
      container.innerHTML = videoTag;

      //We do this asynchronously to give time for the dom to be updated
      setTimeout(function() {
        var videoEl = container.querySelector('.video-js');
        cb(videoEl);
      }, 0);
    }
  }
});