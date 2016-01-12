function Companion(companionJTree) {
  if (!(this instanceof Companion)) {
    return new Companion(companionJTree);
  }

  //Required Fields
  this.creativeType = companionJTree.staticResource.attr('creativeType');
  this.creativeResource = xml.keyValue(companionJTree.staticResource);

  // Optional Fields
  this.id = companionJTree.attr('id');
  this.width = companionJTree.attr('width');
  this.height = companionJTree.attr('height');
  this.expandedWidth = companionJTree.attr('expandedWidth');
  this.expandedHeight = companionJTree.attr('expandedHeight');
  this.scalable = companionJTree.attr('scalable');
  this.maintainAspectRatio = companionJTree.attr('maintainAspectRatio');
  this.minSuggestedDuration = companionJTree.attr('minSuggestedDuration');
  this.apiFramework = companionJTree.attr('apiFramework');
  this.companionClickThrough = xml.keyValue(companionJTree.companionClickThrough);
  this.trackingEvents = parseTrackingEvents(companionJTree.trackingEvents && companionJTree.trackingEvents.tracking);

  /*** Local functions ***/
  function parseTrackingEvents(trackingEvents) {
    var trackings = [];
    if (isDefined(trackingEvents)) {
      trackingEvents = isArray(trackingEvents) ? trackingEvents : [trackingEvents];
      trackingEvents.forEach(function (trackingData) {
        trackings.push(new TrackingEvent(trackingData));
      });
    }
    return trackings;
  }
}