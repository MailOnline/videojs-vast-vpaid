var dom = require('./miniDom');
var adsSetupPlugin = require('./ads-setup-plugin');

videojs.plugin('ads-setup', adsSetupPlugin);

dom.onReady(function () {
  var vastForm = document.querySelector('form#vast-form');
  var vpaidForm = document.querySelector('form#vpaid-form');

  initForm(vastForm);
  initForm(vpaidForm);

  /*** Local functions ***/
  function initForm(formEl){
    var tagTypeEl = formEl.querySelector('input.tag-type-radio');
    var xmlTypeEl = formEl.querySelector('input.xml-type-radio');
    var updateBtn = formEl.querySelector('.button.button-primary');
    var tagEl = formEl.querySelector('input.tag-el');
    var xmlEl = formEl.querySelector('select.xml-el');
    var videoContainer = formEl.querySelector('div.vjs-video-container');

    updateVisibility(formEl);
    dom.addEventListener(tagTypeEl, 'change', updateVisibility);
    dom.addEventListener(xmlTypeEl, 'change', updateVisibility);
    dom.addEventListener(updateBtn, 'click', updateDemo);

    updateDemo();

    /*** Local functions ***/
    function updateVisibility() {
      dom.removeClass(formEl, 'TAG');
      dom.removeClass(formEl, 'XML');
      dom.addClass(formEl, tagTypeEl.checked ? 'TAG' : 'XML');
    }

    function updateDemo(){
      createVideoEl(videoContainer, function(videoEl){
        var adsTag = activeMode() === 'TAG'? tagEl.value : xmlEl.value;
        videojs(videoEl, {
          "plugins": {
            "ads-setup":{
              "adCancelTimeout": 5000,
              "adsEnabled": true,
              "adsTag": adsTag
            }
          }
        });
      });
    }

    function activeMode(){
      return tagTypeEl.checked ? 'TAG' : 'XML';
    }

    function createVideoEl(container, cb){
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
      setTimeout(function () {
        var videoEl = container.querySelector('.video-js');
        cb(videoEl);
      }, 0);
    }
  }
});