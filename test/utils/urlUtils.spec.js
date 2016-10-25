

const urlUtils = require('../../src/scripts/utils/urlUtils');

describe('urlUtils.urlParts', () => {
  it('must normalize a relative url', () => {
    assert.match(urlUtils.urlParts('foo').href, /^https?:\/\/[^/]+\/foo$/);
    assert.match(urlUtils.urlParts('foo?name=carlos').href, /^https?:\/\/[^/]+\/foo\?name=carlos$/);
  });

  it('must not do anything on a normalized url', () => {
    assert.equal(urlUtils.urlParts('http://www.google.com').href, 'http://www.google.com/');
  });

  it('must parse relative URL into component pieces', () => {
    const parsed = urlUtils.urlParts('foo');

    assert.match(parsed.href, /https?:\/\//);
    assert.match(parsed.protocol, /^https?/);
    assert.notEqual(parsed.host, '');
    assert.notEqual(parsed.hostname, '');
    assert.notEqual(parsed.pathname, '');
  });

  describe('dictionary property', () => {
    describe('protocol', () => {
      it('must contain the protocol of the normalized url', () => {
        assert.match(urlUtils.urlParts('http://foo').protocol, /^http/);
        assert.match(urlUtils.urlParts('https://foo.com').protocol, /^https/);
      });
    });

    describe('host', () => {
      it('must contain the host', () => {
        assert.equal(urlUtils.urlParts('http://www.google.com:8080').host, 'www.google.com:8080');
        assert.match(urlUtils.urlParts('http://gmail.com').host, /gmail\.com(:80)?/g);
      });
    });

    describe('search', () => {
      it('must contain the search part of the url without the ?', () => {
        assert.equal(urlUtils.urlParts('http://www.google.com').search, '');
        assert.equal(urlUtils.urlParts('http://www.google.com?name=Carlos').search, 'name=Carlos');
        assert.equal(urlUtils.urlParts('http://www.google.com?name=Carlos&surname=Serrano').search, 'name=Carlos&surname=Serrano');
      });
    });

    describe('hash', () => {
      it('must return the hash part of a url without the #', () => {
        assert.equal(urlUtils.urlParts('http://www.google.com').hash, '');
        assert.equal(urlUtils.urlParts('http://google.com#nose').hash, 'nose');
      });
    });

    describe('hostName', () => {
      it('must return the hostname of the url', () => {
        assert.equal(urlUtils.urlParts('http://www.google.com:8080').hostname, 'www.google.com');
        assert.equal(urlUtils.urlParts('http://gmail.com').hostname, 'gmail.com');
      });
    });

    describe('port', () => {
      it('must return the port of the url if specified', () => {
        assert.equal(urlUtils.urlParts('http://www.google.com').port, '80');
        assert.equal(urlUtils.urlParts('http://www.google.com:8080').port, '8080');
      });
    });

    describe('pathName', () => {
      it('must return the pathname of the url', () => {
        assert.equal(urlUtils.urlParts('http://www.google.com/example/demo.html').pathname, '/example/demo.html');
        assert.equal(urlUtils.urlParts('http://www.google.com').pathname, '/');
        assert.equal(urlUtils.urlParts('/').pathname, '/');
        assert.equal(urlUtils.urlParts('http://www.google.com/index.html').pathname, '/index.html');
      });
    });
  });
});

describe('urlUtils.queryStringToObj', () => {
  it('must transform the passed query string into a dictionary/map', () => {
    const expectedObj = {
      name: 'carlos',
      surname: 'serrano'
    };

    assert.deepEqual(urlUtils.queryStringToObj('?name=carlos&surname=serrano'), expectedObj);
    assert.deepEqual(urlUtils.queryStringToObj('name=carlos&surname=serrano'), expectedObj);
    assert.deepEqual(urlUtils.queryStringToObj(' ?name=carlos  '), {name: 'carlos'});
    assert.deepEqual(urlUtils.queryStringToObj(' ?name='), {name: ''});
    assert.deepEqual(urlUtils.queryStringToObj(''), {});
  });

  it('must be possible to conditionally decide if a key value pair gets added to the resulting object', () => {
    const isNotSerrano = function (key, value) {
      return !(key === 'surname' && value === 'serrano');
    };

    assert.deepEqual(urlUtils.queryStringToObj('name=carlos&surname=serrano', isNotSerrano), {name: 'carlos'});
  });
});

describe('urlUtils.objToQueryString', () => {
  it('must transform the passed object into a query string ', () => {
    assert.deepEqual(urlUtils.objToQueryString({
      name: 'carlos',
      surname: 'serrano'
    }), 'name=carlos&surname=serrano');
    assert.deepEqual(urlUtils.objToQueryString({name: 'carlos'}), 'name=carlos');
    assert.deepEqual(urlUtils.objToQueryString({}), '');
  });
});
