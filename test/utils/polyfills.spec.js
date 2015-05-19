describe("parseInt", function(){
  it("must work propertly with numbers that start with 0", function(){
    assert.equal(parseInt('009'), 9);
    assert.equal(parseInt('01'), 1);
  });
});