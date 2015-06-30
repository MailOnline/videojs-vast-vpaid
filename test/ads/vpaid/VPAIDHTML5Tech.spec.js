describe("VPAIDHTML5Tech", function() {
  it("must be a function", function () {
    assert.isFunction(VPAIDHTML5Tech);
  });

  it("must return an instance of itself", function() {
    assert.instanceOf(VPAIDHTML5Tech({src: 'fakeSource'}), VPAIDHTML5Tech);
  });
});

