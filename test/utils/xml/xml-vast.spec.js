var xml = require('utils/xml');

/*jslint maxlen: 800 */
describe("VAST XML", function(){
  var sampleVastXmlStr = '<?xml version="1.0" encoding="UTF-8"?>'+
  '<VAST xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="vast.xsd" version="3.0">'+
    '<Ad id="107195552">'+
      '<inLine>'+
        '<AdSystem>GDFP</AdSystem>'+
        '<AdTitle>41683 Hof Christmas</AdTitle>'+
        '<Description>41683 Hof Christmas ad</Description>'+
        '<Error><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=videoplayfailed[ERRORCODE]]]></Error>'+
        '<Impression><![CDATA[]]></Impression>'+
        '<Creatives>'+
          '<Creative id="49173956312" sequence="1">'+
            '<Linear>'+
              '<Duration>00:00:20</Duration>'+
              '<TrackingEvents>'+
                '<Tracking event="start"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=part2viewed]]></Tracking>'+
                '<Tracking event="start"><![CDATA[http://servedby.flashtalking.com/imp/6/41415;1021740;201;redirect;MailOnline;VODTracking/?cachebuster=105851090&url=http://pi.dc-storm.com/dcv4/logi.aspx?tsid=50819&sid=4288&acid=12053&cid=919231&agid=46886750&adid=626106130&rnd=]]></Tracking>'+
                '<Tracking event="firstQuartile"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=videoplaytime25]]></Tracking>'+
                '<Tracking event="midpoint"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=videoplaytime50]]></Tracking>'+
                '<Tracking event="thirdQuartile"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=videoplaytime75]]></Tracking>'+
                '<Tracking event="complete"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=videoplaytime100]]></Tracking>'+
                '<Tracking event="mute"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=admute]]></Tracking>'+
                '<Tracking event="unmute"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=adunmute]]></Tracking>'+
                '<Tracking event="rewind"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=adrewind]]></Tracking>'+
                '<Tracking event="pause"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=adpause]]></Tracking>'+
                '<Tracking event="resume"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=adresume]]></Tracking>'+
                '<Tracking event="fullscreen"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=adfullscreen]]></Tracking>'+
                '<Tracking event="creativeView"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=vast_creativeview]]></Tracking>'+
                '<Tracking event="exitFullscreen"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=vast_exit_fullscreen]]></Tracking>'+
                '<Tracking event="acceptInvitationLinear"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=acceptinvitation]]></Tracking>'+
                '<Tracking event="closeLinear"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=adclose]]></Tracking>'+
                '<Tracking event="start"><![CDATA[http://video-ad-stats.googlesyndication.com/video/client_events?event=2&web_property=ca-pub-3711291450444968&cpn=[CPN]&break_type=[BREAK_TYPE]&slot_pos=[SLOT_POS]&ad_id=[AD_ID]&ad_sys=[AD_SYS]&ad_len=[AD_LEN]&p_w=[P_W]&p_h=[P_H]&mt=[MT]&rwt=[RWT]&wt=[WT]&sdkv=[SDKV]&vol=[VOL]&content_v=[CONTENT_V]&conn=[CONN]&format=[FORMAT_NAMESPACE]_[FORMAT_TYPE]_[FORMAT_SUBTYPE]]]></Tracking>'+
                '<Tracking event="complete"><![CDATA[http://video-ad-stats.googlesyndication.com/video/client_events?event=3&web_property=ca-pub-3711291450444968&cpn=[CPN]&break_type=[BREAK_TYPE]&slot_pos=[SLOT_POS]&ad_id=[AD_ID]&ad_sys=[AD_SYS]&ad_len=[AD_LEN]&p_w=[P_W]&p_h=[P_H]&mt=[MT]&rwt=[RWT]&wt=[WT]&sdkv=[SDKV]&vol=[VOL]&content_v=[CONTENT_V]&conn=[CONN]&format=[FORMAT_NAMESPACE]_[FORMAT_TYPE]_[FORMAT_SUBTYPE]]]></Tracking>'+
              '</TrackingEvents>'+
              '<VideoClicks>'+
                '<ClickThrough id="GDFP"><![CDATA[http://pubads.g.doubleclick.net/aclk?sa=L&ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&num=0&sig=AOD64_23loII8hcBocRVGqSw4_GDtu2uAw&client=ca-pub-3711291450444968&adurl=http://servedby.flashtalking.com/click/6/41415%3B1021740%3B369262%3B211%3B0/%3Fft_width%3D1%26ft_height%3D1%26url%3D6110110]]></ClickThrough>'+
                '<ClickTracking id=""><![CDATA[http://video-ad-stats.googlesyndication.com/video/client_events?event=6&web_property=ca-pub-3711291450444968&cpn=[CPN]&break_type=[BREAK_TYPE]&slot_pos=[SLOT_POS]&ad_id=[AD_ID]&ad_sys=[AD_SYS]&ad_len=[AD_LEN]&p_w=[P_W]&p_h=[P_H]&mt=[MT]&rwt=[RWT]&wt=[WT]&sdkv=[SDKV]&vol=[VOL]&content_v=[CONTENT_V]&conn=[CONN]&format=[FORMAT_NAMESPACE]_[FORMAT_TYPE]_[FORMAT_SUBTYPE]]]></ClickTracking>'+
              '</VideoClicks>'+
              '<MediaFiles>'+
                '<MediaFile id="GDFP" delivery="progressive" width="426" height="240" type="video/x-flv" bitrate="352" scalable="true" maintainAspectRatio="true"><![CDATA[http://redirector.gvt1.com/videoplayback/id/22aa913f446cc5f6/itag/5/source/gfp_video_ads/ip/0.0.0.0/ipbits/0/expire/1418657392/sparams/ip,ipbits,expire,id,itag,source/signature/9C397CDA262B0627AF4F3016EA6FBD3E8230F550.9CF338D9BA74E4B0BEACAF3343F70402E4BC7057/key/ck2/file/file.flv]]></MediaFile>'+
                '<MediaFile id="GDFP" delivery="progressive" width="176" height="144" type="video/3gpp" bitrate="74" scalable="true" maintainAspectRatio="true"><![CDATA[http://redirector.gvt1.com/videoplayback/id/22aa913f446cc5f6/itag/17/source/gfp_video_ads/ip/0.0.0.0/ipbits/0/expire/1418657392/sparams/ip,ipbits,expire,id,itag,source/signature/8AEB58C02E039A67FBC1641C8C17D3886F57DE9B.7A4ABDF48CCA167B51F683EE86ABAC3C661DB88E/key/ck2/file/file.3gp]]></MediaFile>'+
                '<MediaFile id="GDFP" delivery="progressive" width="320" height="180" type="video/3gpp" bitrate="201" scalable="true" maintainAspectRatio="true"><![CDATA[http://redirector.gvt1.com/videoplayback/id/22aa913f446cc5f6/itag/36/source/gfp_video_ads/ip/0.0.0.0/ipbits/0/expire/1418657392/sparams/ip,ipbits,expire,id,itag,source/signature/5D52965D93F4651A3D33F00D67E6FEBBFEE3F916.3FC4F50A7F892772370010DC3EE78D5677C99083/key/ck2/file/file.3gp]]></MediaFile>'+
                '<MediaFile id="GDFP" delivery="progressive" width="636" height="358" type="video/x-flv" bitrate="758" scalable="true" maintainAspectRatio="true"><![CDATA[http://redirector.gvt1.com/videoplayback/id/22aa913f446cc5f6/itag/34/source/gfp_video_ads/ip/0.0.0.0/ipbits/0/expire/1418657392/sparams/ip,ipbits,expire,id,itag,source/signature/3AA90F025A70B80F27755871201320BA8A4DEB5B.17DBDDC81EB1A5756C88D9EF6ADA36FDACBFEC9A/key/ck2/file/file.flv]]></MediaFile>'+
                '<MediaFile id="GDFP" delivery="progressive" width="636" height="358" type="video/mp4" bitrate="676" scalable="true" maintainAspectRatio="true"><![CDATA[http://redirector.gvt1.com/videoplayback/id/22aa913f446cc5f6/itag/18/source/gfp_video_ads/ip/0.0.0.0/ipbits/0/expire/1418657392/sparams/ip,ipbits,expire,id,itag,source/signature/527FB4CEC0E54C4FC1DD35C59F7739B7720BE6EC.5919A97C1241D8A2FC7A324D71B86F9929FE0514/key/ck2/file/file.mp4]]></MediaFile>'+
                '<MediaFile id="GDFP" delivery="progressive" width="636" height="358" type="video/webm" bitrate="842" scalable="true" maintainAspectRatio="true"><![CDATA[http://redirector.gvt1.com/videoplayback/id/22aa913f446cc5f6/itag/43/source/gfp_video_ads/ip/0.0.0.0/ipbits/0/expire/1418657392/sparams/ip,ipbits,expire,id,itag,source/signature/6D63A82E5251CE66A5D370E2ECD2FD3669273372.1185277B2B62B3389DED87F2C29B73B24C0ADBB8/key/ck2/file/file.webm]]></MediaFile>'+
              '</MediaFiles>'+
            '</Linear>'+
          '</Creative>'+
        '</Creatives>'+
        '<Extensions>'+
          '<Extension type="activeview">' +
            '<CustomTracking>'+
              '<Tracking event="viewable_impression"><![CDATA[http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=viewable_impression]]></Tracking>'+
            '</CustomTracking>'+
          '</Extension>'+
          '<Extension type="geo">' +
            '<Bandwidth>4</Bandwidth>'+
          '</Extension>'+
          '<Extension type="waterfall" fallback_index="0"/>'+
        '</Extensions>' +
      '</inLine>'+
    '</Ad>'+
  '</VAST>';

  var vastTree;

  beforeEach(function(){
    vastTree = xml.toJXONTree(sampleVastXmlStr);
  });

  it("must contain an Ad with id = 107195552", function(){
    assert.isObject(vastTree.ad);
    assert.equal(vastTree.ad['@id'], 107195552);
  });

  describe("ad", function(){
    var ad;

    beforeEach(function(){
      ad = vastTree.ad;
    });

    it("must contain inLine", function(){
      assert.isObject(ad.inLine);
    });

    describe("inLine", function(){
      var inLine;

      beforeEach(function(){
        inLine = ad.inLine;
      });

      it("must set the adsystem", function(){
        assert.equal(inLine.adSystem.keyValue, 'GDFP');
      });

      it("must set the adtitle", function(){
        assert.equal(inLine.adTitle.keyValue, '41683 Hof Christmas');
      });

      it("must set the description", function(){
        assert.equal(inLine.description.keyValue, '41683 Hof Christmas ad');
      });

      it("must set the Error", function(){
        assert.equal(inLine.error.keyValue, 'http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=videoplayfailed[ERRORCODE]');
      });

      describe("creatives", function(){
        var creatives;

        beforeEach(function(){
          creatives = inLine.creatives;
        });

        it("must contain one creative", function(){
          assert.isObject(creatives.creative);
          assert.equal(creatives.creative["@id"], 49173956312);
          assert.equal(creatives.creative["@sequence"], 1);
        });

        describe("creative", function(){
          var creative;

          beforeEach(function(){
            creative = creatives.creative;
          });

          it("must have one linear", function(){
            assert.isObject(creative.linear);
          });

          describe("linear", function(){
            var linear;

            beforeEach(function(){
              linear = creative.linear;
            });

            it("must contain the duration", function(){
              assert.equal(linear.duration.keyValue, "00:00:20");
            });

            it("must contain tracking events", function(){
              assert.isArray(linear.trackingEvents.tracking);
              assert.equal(linear.trackingEvents.tracking.length, 18);
            });

            describe("trackingEvents", function(){
              var trackingEvents;

              beforeEach(function(){
                trackingEvents = linear.trackingEvents.tracking;
              });

              it("must contain start event", function(){
                assert.equal(trackingEvents[0].keyValue, "http://pubads.g.doubleclick.net/pagead/conversion/?ai=Bc4roEKqOVIzhJqPi7ga7y4G4CrjOsO4FAAAAEAEgyJaWHDgAWNiN_Je3AWC7rquD0AqyARN3d3cuZGFpbHltYWlsLmNvLnVrugENOHg4X3htbF92YXN0M8gBBdoBqAFodHRwOi8vd3d3LmRhaWx5bWFpbC5jby51ay90dnNob3diaXovYXJ0aWNsZS0yODU2OTEyL1BhcnR5LWdpcmwtUmloYW5uYS1sZXRzLWxvb3NlLWRhbmNlZmxvb3Itc2hvd3MtcmF1bmNoeS1tb3Zlcy1zZW1pLXNoZWVyLWdvd24tQnJpdGlzaC1GYXNoaW9uLUF3YXJkcy1hZnRlcnBhcnR5Lmh0bWyYAuiEAakCPN_bpEVluj7AAgLgAgDqAiEvNTc2NS9kbS52aWRlby9kbV92aWRlb190dnNob3diaXr4AvnRHpAD0AWYA9AFqAMB4AQBoAYj&sigh=fy3coLR3uPk&label=part2viewed");
                assert.equal(trackingEvents[0].attr('event'), 'start');
              });
            });
          });
        });
      });
    });
  });
});