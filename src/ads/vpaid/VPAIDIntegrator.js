function VPAIDIntegrator(player, adStartTimeout) {
  if (!(this instanceof VPAIDIntegrator)) {
    return new VPAIDIntegrator(player, adStartTimeout);
  }

  this.VIEW_MODE = {
    NORMAL: 'normal',
    FULLSCREEN: "fullscreen",
    THUMBNAIL: "thumbnail"
  };
  this.player = player;
  this.adStartTimeout = adStartTimeout || 5000;
  this.containerEl = createVPAIDContainerEl(player);
  this.options = {
    adStartTimeout: adStartTimeout || 5000,
    responseTimeout: 2000,
    VPAID_VERSION: {
      full: '2.0',
      major: 2,
      minor: 0
    }
  };

  /*** Local functions ***/

  function createVPAIDContainerEl() {
    var containerEl = document.createElement('div');
    dom.addClass(containerEl, 'VPAID-container');
    player.el().appendChild(containerEl);
    return containerEl;

  }
}

//List of supported VPAID technologies
VPAIDIntegrator.techs = [
  VPAIDFlashTech
];

VPAIDIntegrator.prototype.playAd = function playVPaidAd(vastResponse, callback) {
  callback = callback || noop;

  if (!(vastResponse instanceof VASTResponse)) {
    return callback(new VASTError('On VASTIntegrator, missing required VASTResponse'));
  }

  async.waterfall([
    function (next) {
      next(null, vastResponse);
    },
    this._loadAdUnit.bind(this),
    this._handshake.bind(this),
    this._initAd.bind(this)


  ], callback);

};

VPAIDIntegrator.prototype._loadAdUnit = function loadAdUnit(vastResponse, next) {
  var that = this;
  var vpaidMediaFile = findSupportedMediaFile(vastResponse.mediaFiles);
  
  if (vpaidMediaFile) {
    loadAdUnit(vpaidMediaFile, function(error, adUnit) {
      if(error) {
        return next(error);
      }
      return next(null, new VPAIDAdUnitWrapper(adUnit, that.options), vastResponse);
    });
  } else {
    next(new VASTError('on VPAIDIntegrator._loadAdUnit, could not find a supported mediaFile'));
  }

  return null;


  /*** Local functions ***/

  function findSupportedMediaFile(mediaFiles) {
    var vpaidMediaFiles = mediaFiles.filter(isVPAID);
    var i, len, mediaFile, tech;

    for (i = 0, len = vpaidMediaFiles.length; i < len; i += 1) {
      mediaFile = vpaidMediaFiles[i];
      tech = findSupportedTech(mediaFile);
      if (tech) {
        return mediaFile;
      }
    }

    return null;
  }

  function findSupportedTech(mediafile) {
    var type = mediafile.type;
    var i, len, VPAIDTech;

    for (i = 0, len = VPAIDIntegrator.techs.length; i < len; i += 1) {
      VPAIDTech = VPAIDIntegrator.techs[i];
      if (VPAIDTech.supports(type)) {
        return new VPAIDTech();
      }
    }
    return null;
  }

  function isVPAID(mediaFile) {
    return mediaFile.apiFramework === 'VPAID';
  }

  function loadAdUnit(mediaFile, callback) {
    var tech = findSupportedTech(vpaidMediaFile);
    tech.loadAdUnit(that.containerEl, mediaFile.src, callback);
  }
};


VPAIDIntegrator.prototype._handshake = function handshake(adUnit, vastResponse, next) {
  adUnit.handshakeVersion('2.0', function(error, version) {
    if(error) {
      return next(error);
    }

    if(version && isSupportedVersion(version)){
      return next(null, adUnit, vastResponse);
    }

    return next(new VASTError('on VPAIDIntegrator._handshake, unsupported version "'+version+'"'))
  });

  function isSupportedVersion(version) {
    var majorNum = major(version);
    return majorNum >=1 && majorNum <= 2;
  }

  function major(version){
    var parts = version.split('.');
    return parseInt(parts[0], 10);
  }
};

VPAIDIntegrator.prototype._initAd = function(adUnit, vastResponse, next) {
  var dimension = dom.getDimension(this.player.el());
  adUnit.initAd(dimension.width, dimension.height, this.VIEW_MODE.NORMAL , -1, '', function() {

  });
};

//TODO: MISSING TRACK ERROR