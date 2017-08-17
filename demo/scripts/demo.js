var dom = require('./miniDom');
var adsSetupPlugin = require('./ads-setup-plugin');
var messages = require('./messages');

videojs.registerPlugin('ads-setup', adsSetupPlugin);

dom.onReady(function() {
  var vastForm = document.querySelector('form#vast-vpaid-form');

  initForm(vastForm);

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

    if (pauseBtn && resumeBtn) {
      dom.addEventListener(pauseBtn, 'click', function() {
        pauseAd();
        messages.success("ad paused");
      });

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
        showResumeBtn();
      }
    }

    function resumeAd() {
      if (player) {
        player.vast.adUnit.resumeAd();
        showPauseBtn();
      }
    }

    function showResumeBtn(){
      pauseBtn.style.display = 'none';
      resumeBtn.style.display = 'inline-block';
    }

    function showPauseBtn(){
      pauseBtn.style.display = 'inline-block';
      resumeBtn.style.display = 'none';
    }

    function updateDemo() {
      createVideoEl(videoContainer, function(videoEl) {
        var mode = activeMode();
        var adPluginOpts = {
          "plugins": {
            "ads-setup":{
              "adCancelTimeout":20000,// Wait for ten seconds before canceling the ad.
              "adsEnabled": true
            }
          }
        };

        if (mode === 'TAG') {
          adPluginOpts.plugins["ads-setup"].adTagUrl = tagEl.value;
        } else if (mode === 'XML') {
          adPluginOpts.plugins["ads-setup"].adTagUrl = xmlEl.value;
        } else {
          adPluginOpts.plugins["ads-setup"].adTagXML = function(done){
            //The setTimeout is to simulate asynchrony
            setTimeout(function () {
              done(null, customEl.value);
            }, 0);
          };
        }

        player = videojs(videoEl, adPluginOpts);

        //We hide the pause and resume btns every time we update
        if (pauseBtn) {
          pauseBtn.style.display = 'none';
          resumeBtn.style.display = 'none';
        }


        if(player) {
          player.on('vast.adStart', function() {
            showPauseBtn();
            player.on('play', showPauseBtn);
            player.on('pause', showResumeBtn);
            player.one('vast.adEnd', function() {
              pauseBtn.style.display = 'none';
              resumeBtn.style.display = 'none';

              player.off('play', showPauseBtn);
              player.off('pause', showResumeBtn);
            });
          });
        }
      });
    }

    function activeMode() {
      if (tagTypeEl.checked) {
        return 'TAG';
      }

      if (xmlTypeEl.checked) {
        return 'XML';
      }

      return 'CUSTOM';
    }

    function createVideoEl(container, cb) {
      var videoTag = '<video class="video-js vjs-default-skin" controls preload="auto" poster="http://vjs.zencdn.net/v/oceans.png" >' +
        '<source src="http://vjs.zencdn.net/v/oceans.mp4" type="video/mp4"/>' +
        '<source src="http://vjs.zencdn.net/v/oceans.webm" type="video/webm"/>' +
        '<source src="http://vjs.zencdn.net/v/oceans.ogv" type="video/ogg"/>' +
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
