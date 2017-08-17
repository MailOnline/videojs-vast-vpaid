# videojs-vast-vpaid plugin
[![Build Status](https://travis-ci.org/MailOnline/videojs-vast-vpaid.svg?branch=master)](https://travis-ci.org/MailOnline/videojs-vast-vpaid)
[![Code Climate](https://codeclimate.com/github/MailOnline/videojs-vast-vpaid/badges/gpa.svg)](https://codeclimate.com/github/MailOnline/videojs-vast-vpaid)
[![Test Coverage](https://codeclimate.com/github/MailOnline/videojs-vast-vpaid/badges/coverage.svg)](https://codeclimate.com/github/MailOnline/videojs-vast-vpaid/coverage)

This plugin allows videojs to monetise its videos. To do so, it implements the [VAST](http://www.iab.net/media/file/VASTv3.0.pdf) and [VPAID](http://www.iab.net/media/file/VPAID_2.0_Final_04-10-2012.pdf) specifications from IAB.

Currently we support VAST and VPAID [Flash](https://github.com/MailOnline/VPAIDFLASHClient) and [HTML5](https://github.com/MailOnline/VPAIDHTML5Client) preroll ads, we will add more VAST ad types as we need them.

#### [DEMO HERE!!!](http://mailonline.github.io/videojs-vast-vpaid)

---

## Integration with video.js 4 and 5
To integrate the plugin with videoJs you need to:

**1- Add [all files from MailOnline/videojs-vast-vpaid/RELEASE/bin](https://github.com/MailOnline/videojs-vast-vpaid/tree/RELEASE/bin) to some path in your server**

**2- If you don't have videoJs, add it's scripts and stylesheet to your page**
```html
<!-- Video.js 5 -->
<link href="http://vjs.zencdn.net/5.4.6/video-js.css" rel="stylesheet">
<script src="http://vjs.zencdn.net/5.4.6/video.js"></script>
```

**3- After videoJs add the plugin script stylesheet**
```html
<!-- Common -->
<link href="/path/to/videojs.vast.vpaid.min.css" rel="stylesheet">
```
and the videojs version specific plugin
```html
<!-- Video.js 5 -->
<script src="/path/to/videojs_6.vast.vpaid.min.js"></script>
```

**4- Create you own ads plugin to pass an add media tag to the plugin**

Below you have a simple ads-setup-plugin

```javascript
videojs.registerPlugin('ads-setup', function (opts) {
    var player = this;
    var adsCancelTimeout = 3000;

    var vastAd = player.vastClient({
      //Media tag URL
      adTagUrl: "http://pubads.g.doubleclick.net/gampad/ads?env=....",
      playAdAlways: true,
      //Note: As requested we set the preroll timeout at the same place than the adsCancelTimeout
      adCancelTimeout: adsCancelTimeout,
      adsEnabled: !!options.adsEnabled
    });
});
```

You can also configure the vast plugin using the data-setup attribute

```html
<video id="example_video_1" class="video-js vjs-default-skin"
    controls preload="auto" width="640" height="264"
    poster="http://vjs.zencdn.net/v/oceans.png"
    data-setup='{
      "plugins": {
      "vastClient": {
        "adTagUrl": "http://pubads.g.doubleclick.net/gampad/ads?env=....",
        "adCancelTimeout": 5000,
        "adsEnabled": true
        }
      }
    }'>
  <source src="http://vjs.zencdn.net/v/oceans.mp4" type='video/mp4'/>
  <source src="http://vjs.zencdn.net/v/oceans.webm" type='video/webm'/>
  <source src="http://vjs.zencdn.net/v/oceans.ogv" type='video/ogg'/>
  <p class="vjs-no-js">
    To view this video please enable JavaScript, and consider upgrading to a web browser that
    <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>
  </p>
</video>
```

---

## Migration from videojs-vast-vpaid 0.1 to 1.0

if you will still use videojs version 4 you need to
* download the new bin folder
* replace, in your pages,  ```videojs-vast-vpaid.css``` with  ```videojs.vast.vpaid.css```
 *( or ```videojs-vast-vpaid.min.css``` with ```videojs.vast.vpaid.min.css```  if you were using the minified version)*

if you want to update to videojs 5 just follow the instruction in the **Integration with video.js 4 and 5** chapter

---

## Options

#### adTagUrl
Use it to pass the ad media tag, it can be a string containing the Media tag url or a function that will return the Media tag whenever called;
On initialization, the plugin will call the function and store the returned Media tag to request the VAST/VPAID ads
```javascript
// Hardcoded Media Tag
var vastAd = player.vastClient({
    adTagUrl: "http://pubads.g.doubleclick.net/gampad/ads?env=....",
    ...
});
```
```javascript
//Dynamic Media Tag
var vastAd = player.vastClient({
    adTagUrl: getAdsUrl,
    ...
});

function getAdsUrl() {
    return "http://pubads.g.doubleclick.net/gampad/ads?env=....";
}
```

#### url (deprecated)
**This option is deprecated and you should use adTagUrl instead**
Use it to pass the ad media tag, it can be a string containing the Media tag url
```javascript
// Hardcoded Media Tag
var vastAd = player.vastClient({
    url: "http://pubads.g.doubleclick.net/gampad/ads?env=....",
    ...
});
```
```javascript
//Dynamic Media Tag
var vastAd = player.vastClient({
    url: getAdsUrl,
    ...
});

function getAdsUrl() {
    return "http://pubads.g.doubleclick.net/gampad/ads?env=....";
}
```

#### adTagXML

You can now do the VAST xml request on your own with our shinny new adTagXML option.
All you need to do is to pass the request fn as the adTagXML option when you initialize the plugin.
See below for an example

```javascript
var vastAd = player.vastClient({
    adTagXML: requestVASTXML,
    ...
});

function requestVASTXML(callback) {
    //The setTimeout below is to simulate asynchrony
    setTimeout(function(){
        callback(null, '<VAST version="3.0"><Ad><Inline>...</Inline></Ad></VAST>');
    }, 0);
}
```
As you can see the requestVASTXML function above expects a node like error-first-callback that needs to be called whenever we are ready to serve the VAST XML.
If you had any error executing the request, you need to pass it as the first argument of the callback
and if there was no error pass null as the first argument and the VAST XML string as the second argument.

#### playAdAlways
Flag to indicate if we must play an ad whenever possible. If set to true the plugin will play an ad every time the user watches a new video or replays the actual video.
```Defaults to false```

#### adCancelTimeout
Number of milliseconds for the ad to start before canceling it.
```Defaults to 3000ms```

#### adsEnabled
Flag to enable/disable the ads.
```Defaults to true```

#### autoResize
Flag to enable resize of the adUnit on window's `resize` and `orientationchange` events. This is useful for responsive players.
```Defaults to true```

#### vpaidFlashLoaderPath
Path to the vpaidFlashloader swf file.
```Defaults to '/VPAIDFlash.swf'```

#### preferredTech
Option to tell the plugin what type of mediaFile to open first. By default, the plugin will load the first supported mediaFile. This is a way to ensure HTML5 is loaded even if a .swf is the first option in the MediaFiles array.
```Defaults to undefined```

Available Options:

```flash``` which will attempt to load available ```application/x-shockwave-flash``` -or-

```html5``` which will attempt to load available ```application/javascript```

You can also pass in the mimeType itself if you'd like to be more explicit.

#### verbosity
verbosity of console logging;
```Defaults to 0```

- 0 - error
- 1 - error, warn
- 2 - error, warn, info
- 3 - error, warn, info, log
- 4 - error, warn, info, log, debug


---

## Returned object
 An invocation to ```player.vastClient({...})``` returns and object that with some helper functions that allow you to dynamically enable or disable the vast plugin, or check if it is enabled.
```javascript
var vastPlugin = player.vastClient({
    adTagUrl: getAdsUrl,
    playAdAlways: true,
    //Note: As requested we set the preroll timeout at the same place than the adsCancelTimeout
    adCancelTimeout: adsCancelTimeout,
    adsEnabled: !!options.adsEnabled
});

player.on('reset', function () {
    if (!vastPlugin.isEnabled()) {
        vastPlugin.enable();
    } else {
        vastAd.disable();
    }
});
```

#### isEnabled()
This function returns true if the player is enabled and false otherwise.

#### enable()
Enables the VAST plugin

#### disable()
Disables the plugin

#### adUnit
If there is an ad playing (after the vast.adStart event) it will contain an obj like the one below:
```
player.vast.adUnit= {
    type: {string} <== The possible types are 'VAST' or 'VPAID'
    pauseAd: {function} <== Pauses the ad unit
    resumeAd: {function} <== Resumes the ad unit
    getSrc: {function} <== Returns the MediaFile instance used to play the ad
}
```
Otherwise it will be null or undefined

#### player.vast
The returned object described above it is also published as a player property so that you can use it anywhere as long as you have access to the player instance.
```javascript
player.vastClient({
    adTagUrl: getAdsUrl,
    playAdAlways: true,
    //Note: As requested we set the preroll timeout at the same place than the adsCancelTimeout
    adCancelTimeout: adsCancelTimeout,
    adsEnabled: !!options.adsEnabled
    });

player.on('reset', function () {
    if (!player.vast.isEnabled()) {
        player.vast.enable();
    } else {
        player.vast.disable();
    }
});
```

---

## Plugin events
The plugin does trigger some events that can be used for tracking or debugging.

##### vast.firstPlay
Fired when the user first plays a video or if the playAdAlways option is set to true every time the user replays the same video

##### vast.adStart
Fired when the ad starts playing

##### vast.adSkip
Fired when the a vast ad gets skiped

##### vast.adError
Fired whenever there is an error with the ad. The error itself gets added to the event object in the property 'error'.

##### vast.adsCancel
Fired whenever the ads are canceled due to an error or because the plugin is not enabled.

##### vast.contentStart
Fired whenever the video content starts playing

##### vast.contentEnd
Fired when the video content ends.

##### vast.reset
Trigger the 'vast.reset' event whenever you want to reset the plugin. Beware that if an ad is playing it will be canceled.

---

## Running the plugin
If you want to run the plugin you need to clone the repo into your local environment
```
git clone git@github.com:MailOnline/videojs-vast-vpaid.git
```
and install the dependencies

```
$ cd videojs-vast-vpaid
$ npm install
$ bower install
```

after installing the dependencies you are ready to go. If you want to see the available build tasks, run
```
$ gulp

Welcome to MailOnline's new
____   ____.__     .___                     __          ____   ____                  __    ____   ____                .__     .___
\   \ /   /|__|  __| _/  ____    ____      |__|  ______ \   \ /   /_____     _______/  |_  \   \ /   /______  _____   |__|  __| _/
 \   Y   / |  | / __ | _/ __ \  /  _ \     |  | /  ___/  \   Y   / \__  \   /  ___/\   __\  \   Y   / \____ \ \__  \  |  | / __ |
  \     /  |  |/ /_/ | \  ___/ (  <_> )    |  | \___ \    \     /   / __ \_ \___ \  |  |     \     /  |  |_> > / __ \_|  |/ /_/ |
   \___/   |__|\____ |  \___  > \____/ /\__|  |/____  >    \___/   (____  //____  > |__|      \___/   |   __/ (____  /|__|\____ |
                    \/      \/         \______|     \/                  \/      \/                    |__|         \/          \/

###### Below, you have the list of all the available build tasks ########
╔═════════════════════════╤════════════════════════════════════════════════════════════════════════════════╗
║ Name                    │ Description                                                                    ║
╟─────────────────────────┼────────────────────────────────────────────────────────────────────────────────╢
║ start                   │ Starts dev server and watch task                                               ║
╟─────────────────────────┼────────────────────────────────────────────────────────────────────────────────╢
║ deploy-demo             │ Builds the demo and deploys it to github pages                                 ║
╟─────────────────────────┼────────────────────────────────────────────────────────────────────────────────╢
║ watch                   │ watches for changes on the plugin files and executes the appropriate tasks     ║
╟─────────────────────────┼────────────────────────────────────────────────────────────────────────────────╢
║ build                   │ This task builds the plugin                                                    ║
╟─────────────────────────┼────────────────────────────────────────────────────────────────────────────────╢
║ build-demo              │ Builds the demo                                                                ║
╟─────────────────────────┼────────────────────────────────────────────────────────────────────────────────╢
║ ci-test                 │ Starts karma test and generates test code coverage, to be used by CI Server    ║
╟─────────────────────────┼────────────────────────────────────────────────────────────────────────────────╢
║ test                    │ Starts karma and test the player                                               ║
╚═════════════════════════╧════════════════════════════════════════════════════════════════════════════════╝

NOTE: if a task is run with '--env production' it will execute the build task for production. Minifying scripts and so on

```
Which will show you a table with the main build tasks. If you want start the demo locally just run:

```
$ gulp start
```
and open the following link into your browser
http://localhost:8086

---

## License

videojs-vast-vpaid plugin is licensed under the MIT License, Version 2.0. [View the license file](LICENSE)

Copyright (c) 2015 MailOnline
