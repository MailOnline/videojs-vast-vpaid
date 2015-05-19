'use strict';

describe('urlParts', function () {
  it('must normalize a relative url', function () {
    assert.match(urlParts("foo").href, /^https?:\/\/[^/]+\/foo$/);
    assert.match(urlParts("foo?name=carlos").href, /^https?:\/\/[^/]+\/foo\?name=carlos$/);
  });

  it("must not do anything on a normalized url", function () {
    assert.equal(urlParts("http://www.google.com").href, 'http://www.google.com/');
  });

  it('must parse relative URL into component pieces', function () {
    var parsed = urlParts("foo");
    assert.match(parsed.href, /https?:\/\//);
    assert.match(parsed.protocol, /^https?/);
    assert.notEqual(parsed.host, "");
    assert.notEqual(parsed.hostname, "");
    assert.notEqual(parsed.pathname, "");
  });

  describe("dictionary property", function () {
    describe("protocol", function () {
      it("must contain the protocol of the normalized url", function () {
        assert.match(urlParts("http://foo").protocol, /^http/);
        assert.match(urlParts("https://foo.com").protocol, /^https/);
      });
    });

    describe("host", function () {
      it("must contain the host", function () {
        assert.equal(urlParts('http://www.google.com:8080').host, 'www.google.com:8080');
        assert.match(urlParts('http://gmail.com').host, /gmail\.com(\:80)?/g);
      });
    });

    describe("search", function () {
      it("must contain the search part of the url without the ?", function () {
        assert.equal(urlParts('http://www.google.com').search, '');
        assert.equal(urlParts('http://www.google.com?name=Carlos').search, 'name=Carlos');
        assert.equal(urlParts('http://www.google.com?name=Carlos&surname=Serrano').search, 'name=Carlos&surname=Serrano');
      });
    });

    describe("hash", function () {
      it("must return the hash part of a url without the #", function () {
        assert.equal(urlParts('http://www.google.com').hash, '');
        assert.equal(urlParts('http://google.com#nose').hash, 'nose');
      });
    });

    describe("hostName", function () {
      it("must return the hostname of the url", function () {
        assert.equal(urlParts('http://www.google.com:8080').hostname, 'www.google.com');
        assert.equal(urlParts('http://gmail.com').hostname, 'gmail.com');
      });
    });

    describe("port", function () {
      it("must return the port of the url if specified", function () {
        assert.equal(urlParts('http://www.google.com').port, '80');
        assert.equal(urlParts('http://www.google.com:8080').port, '8080');
      });
    });

    describe("pathName", function () {
      it("must return the pathname of the url", function () {
        assert.equal(urlParts('http://www.google.com/example/demo.html').pathname, '/example/demo.html');
        assert.equal(urlParts('http://www.google.com').pathname, '/');
        assert.equal(urlParts('/').pathname, '/');
        assert.equal(urlParts('http://www.google.com/index.html').pathname, '/index.html');
      });
    });
  });
});

describe("queryStringToObj", function () {
  it("must transform the passed query string into a dictionary/map", function () {
    assert.deepEqual(queryStringToObj('?name=carlos&surname=serrano'), {name: 'carlos', surname: 'serrano'});
    assert.deepEqual(queryStringToObj('name=carlos&surname=serrano'), {name: 'carlos', surname: 'serrano'});
    assert.deepEqual(queryStringToObj(' ?name=carlos  '), {name: 'carlos'});
    assert.deepEqual(queryStringToObj(' ?name='), {name: ''});
    assert.deepEqual(queryStringToObj(''), {});
  });

  it("must be possible to conditionally decide if a key value pair gets added to the resulting object", function(){
    function isNotSerrano(key, value) {
      return !(key === 'surname' && value === 'serrano');
    }
    assert.deepEqual(queryStringToObj('name=carlos&surname=serrano', isNotSerrano), { name: 'carlos'});
  });
});

describe("objToQueryString", function () {
  it("must transform the passed object into a query string ", function () {
    assert.deepEqual(objToQueryString({name: 'carlos', surname: 'serrano'}), 'name=carlos&surname=serrano');
    assert.deepEqual(objToQueryString({name: 'carlos'}), 'name=carlos');
    assert.deepEqual(objToQueryString({}), '');
  });
});