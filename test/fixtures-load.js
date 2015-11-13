(function (window) {
  var pending_fixtures = 0;
  var fixtures = {};

  //We delay the execution of the karma tests until the assets are loaded.
  //Go to https://zerokspot.com/weblog/2013/07/12/delay-test-execution-in-karma/ for more info
  window.__karma__.loaded = function() {};

  window.fixture = {
    get: getFixture
  };

  [
    { name: 'ad', type: 'xml', url: '/base/test-fixtures/ad.xml' },
    { name: 'wrapper', type: 'xml', url: '/base/test-fixtures/wrapper.xml' },
    { name: 'wrapper2', type: 'xml', url: '/base/test-fixtures/wrapper2.xml' }
  ].forEach(function(fixture){
      if(!fixtures[fixture.type]){
        fixtures[fixture.type] = {};
      }

      pending_fixtures++;
      http.get(fixture.url, function requestFixture(error, response, status) {
          if(error) {
            return console.log('ERROR LOADING THE TEST FIXTURE: '+ status, error);
          }

          fixtures[fixture.type][fixture.name] = response;

          pending_fixtures--;
          
          if(pending_fixtures === 0) {
            finishFixturesLoad();
          }
      });
  });


  /*** local functions ***/

  function getFixture(fixture) {
    return fixtures[fixture.type][fixture.name];
  }

  function finishFixturesLoad(){
    createFixtureShortcutMethods();
    //We run karma start to start the test suite
    window.__karma__.start();
  }

  function createFixtureShortcutMethods(){
    for (var type in fixtures) {
      if (fixtures.hasOwnProperty(type)) {
        window.fixture['get'+capitalizeFirstLetter(type)+'Fixture'] = function(name) {
          return window.fixture.get({type: type, name: name});
        };
      }
    }
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

})(this);
