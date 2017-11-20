require('../styles/demo.scss');
const dom = require('./miniDom');
const adsSetupPlugin = require('./ads-setup-plugin');
const messages = require('./messages');

videojs.plugin('ads-setup', adsSetupPlugin);

dom.onReady(() => {
  const vastForm = document.querySelector('form#vast-vpaid-form');

  initForm(vastForm);

  /* Local functions ***/
  function initForm (formEl) {
    const tagTypeEl = formEl.querySelector('input.tag-type-radio');
    const xmlTypeEl = formEl.querySelector('input.xml-type-radio');
    const customTypeEl = formEl.querySelector('input.custom-type-radio');
    const updateBtn = formEl.querySelector('.button.button-primary');
    const pauseBtn = formEl.querySelector('.pause');
    const resumeBtn = formEl.querySelector('.resume');
    const tagEl = formEl.querySelector('input.tag-el');
    const xmlEl = formEl.querySelector('select.xml-el');
    const customEl = formEl.querySelector('textarea.custom-el');
    const videoContainer = formEl.querySelector('div.vjs-video-container');
    let player;

    updateVisibility();
    dom.addEventListener(tagTypeEl, 'change', updateVisibility);
    dom.addEventListener(xmlTypeEl, 'change', updateVisibility);
    dom.addEventListener(customTypeEl, 'change', updateVisibility);
    dom.addEventListener(updateBtn, 'click', () => {
      updateDemo();
      messages.success('Demo updated!!!');
    });

    if (pauseBtn && resumeBtn) {
      dom.addEventListener(pauseBtn, 'click', () => {
        pauseAd();
        messages.success('ad paused');
      });

      dom.addEventListener(resumeBtn, 'click', () => {
        resumeAd();
        messages.success('ad resumed');
      });
    }

    updateDemo();

    /* Local functions ***/
    function updateVisibility () {
      dom.removeClass(formEl, 'TAG');
      dom.removeClass(formEl, 'XML');
      dom.removeClass(formEl, 'CUSTOM');
      dom.addClass(formEl, activeMode());
    }

    function pauseAd () {
      if (player) {
        player.vast.adUnit.pauseAd();
        showResumeBtn();
      }
    }

    function resumeAd () {
      if (player) {
        player.vast.adUnit.resumeAd();
        showPauseBtn();
      }
    }

    function showResumeBtn () {
      pauseBtn.style.display = 'none';
      resumeBtn.style.display = 'inline-block';
    }

    function showPauseBtn () {
      pauseBtn.style.display = 'inline-block';
      resumeBtn.style.display = 'none';
    }

    function updateDemo () {
      createVideoEl(videoContainer, (videoEl) => {
        const mode = activeMode();
        const adPluginOpts = {
          plugins: {
            'ads-setup': {
              adCancelTimeout: 20000,
              adsEnabled: true
            }
          }
        };

        if (mode === 'TAG') {
          adPluginOpts.plugins['ads-setup'].adTag = tagEl.value;
        } else if (mode === 'XML') {
          adPluginOpts.plugins['ads-setup'].adTag = xmlEl.value;
        } else {
          adPluginOpts.plugins['ads-setup'].adTagXML = (done) => {
            setTimeout(() => {
              done(null, customEl.value);
            }, 0);
          };
        }

        player = videojs(videoEl, adPluginOpts);

        if (pauseBtn) {
          pauseBtn.style.display = 'none';
          resumeBtn.style.display = 'none';
        }

        if (player) {
          player.on('vast.adStart', () => {
            showPauseBtn();
            player.on('play', showPauseBtn);
            player.on('pause', showResumeBtn);
            player.one('vast.adEnd', () => {
              pauseBtn.style.display = 'none';
              resumeBtn.style.display = 'none';

              player.off('play', showPauseBtn);
              player.off('pause', showResumeBtn);
            });
          });
        }
      });
    }

    function activeMode () {
      if (tagTypeEl.checked) {
        return 'TAG';
      }

      if (xmlTypeEl.checked) {
        return 'XML';
      }

      return 'CUSTOM';
    }

    function createVideoEl (container, cb) {
      const videoTag = '<video class="video-js vjs-default-skin" controls preload=auto poster=http://vjs.zencdn.net/v/oceans.png >' +
        '<source src="http://vjs.zencdn.net/v/oceans.mp4" type="video/mp4"/>' +
        '<source src=http://vjs.zencdn.net/v/oceans.webm type=video/webm/>' +
        '<source src=http://vjs.zencdn.net/v/oceans.ogv type=video/ogg/>' +
        '<p class=vjs-no-js>To view this video please enable JavaScript, and consider upgrading to a web browser that ' +
        '<a href=http://videojs.com/html5-video-support/ target=_blank>supports HTML5 video</a>' +
        '</p>' +
        '</video>';

      container.innerHTML = videoTag;

      // We do this asynchronously to give time for the dom to be updated
      setTimeout(() => {
        const videoEl = container.querySelector('.video-js');

        cb(videoEl);
      }, 0);
    }
  }
});
