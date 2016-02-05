var dom = require('utils/dom');
var testUtils = require('../test-utils');

describe("dom", function () {
  var testDiv;

  function createEl(tagName) {
    var el = document.createElement(tagName);
    testDiv.appendChild(el);
    return el;
  }

  beforeEach(function () {
    testDiv = document.createElement("div");
    document.body.appendChild(testDiv);
  });

  afterEach(function () {
    dom.remove(testDiv);
  });

  describe("isVisible", function () {
    it("must return true if the passed element is visible", function () {
      var el = createEl('div');
      assert.isTrue(dom.isVisible(el));
      el.style.visibility = 'visible';
      assert.isTrue(dom.isVisible(el));
      el.style.visibility = 'collapse';
      assert.isTrue(dom.isVisible(el));
      el.style.visibility = 'inherit';
      assert.isTrue(dom.isVisible(el));
    });

    it("must return false if the passed element is not visible", function () {
      var el = createEl('div');
      el.style.visibility = 'hidden';
      assert.isFalse(dom.isVisible(el));
    });
  });

  describe("isShown", function () {
    it("must return true if the element is displayed", function () {
      var el = createEl('div');
      assert.isTrue(dom.isShown(el));
      el.style.display = 'inline';
      assert.isTrue(dom.isShown(el));
      el.style.display = 'block';
      assert.isTrue(dom.isShown(el));
      el.style.display = 'grid';
      assert.isTrue(dom.isShown(el));
      el.style.display = 'initial';
      assert.isTrue(dom.isShown(el));
    });

    it("must return false if the element is not displayed", function () {
      var el = createEl('div');
      el.style.display = 'none';
      assert.isFalse(dom.isShown(el));
    });
  });

  describe("isHidden", function () {
    it("must return true if the element is not displayed and false otherwise", function () {
      var el = createEl('div');
      assert.isFalse(dom.isHidden(el));
      el.style.display = 'inline';
      assert.isFalse(dom.isHidden(el));
      el.style.display = 'block';
      assert.isFalse(dom.isHidden(el));
      el.style.display = 'grid';
      assert.isFalse(dom.isHidden(el));
      el.style.display = 'initial';
      assert.isFalse(dom.isHidden(el));
      el.style.display = 'none';
      assert.isTrue(dom.isHidden(el));
    });
  });

  describe("hide", function () {
    it("must hide the passed el", function () {
      var el = createEl('div');
      assert.isFalse(dom.isHidden(el));

      dom.hide(el);
      assert.isTrue(dom.isHidden(el));
    });
  });

  describe("show", function () {
    it("must show the element", function () {
      var el = createEl('div');
      dom.hide(el);
      assert.isFalse(dom.isShown(el));
      dom.show(el);
      assert.isTrue(dom.isShown(el));
    });

    it("must set the display to what it was originally set", function () {
      var el = createEl('div');
      el.style.display = 'inline';
      dom.hide(el);
      dom.show(el);
      assert.equal(el.style.display, 'inline');
    });

    it("must not modify the style.display property is the element is already visible", function () {
      var el = createEl('div');
      el.style.display = 'block';
      dom.show(el);
      assert.equal(el.style.display, 'block');
    });
  });

  describe("hasClass", function () {
    it("must return true if the passed element has the passed class", function () {
      var el = createEl('div');
      el.setAttribute('class', 'test-class foo-class BlA');
      assert.isTrue(dom.hasClass(el, 'test-class'));
      assert.isTrue(dom.hasClass(el, 'foo-class'));
      assert.isTrue(dom.hasClass(el, 'BlA'));
    });

    it("must return false if the passed el does not have the passed class", function () {
      var el = createEl('div');
      el.setAttribute('class', 'test-class foo-class BlA');
      assert.isTrue(dom.hasClass(el, 'test-class'));
      assert.isFalse(dom.hasClass(el, 'fake-class'));
      assert.isFalse(dom.hasClass(el, 'BLA'));
      assert.isFalse(dom.hasClass(el, 'BLa'));
      assert.isFalse(dom.hasClass(el, 'bla'));
      assert.isFalse(dom.hasClass(el, 'john'));
      assert.isFalse(dom.hasClass(el, ''));
      assert.isFalse(dom.hasClass(el, {}));
      assert.isFalse(dom.hasClass(el, []));
    });
  });

  describe("addClass", function () {
    it("must add the cssClass to the passed element", function () {
      var el = createEl('div');
      assert.isFalse(dom.hasClass(el, 'carlos'));
      dom.addClass(el, 'carlos');
      assert.isTrue(dom.hasClass(el, 'carlos'));
      assert.equal(el.getAttribute('class'), 'carlos');
      dom.addClass(el, 'serrano');
      assert.isTrue(dom.hasClass(el, 'serrano'));
      assert.equal(el.getAttribute('class'), 'carlos serrano');
    });

    it("must not add a class if you don't pass a valid css class", function () {
      var el = createEl('div');
      dom.addClass(el, 'carlos');
      assert.isTrue(dom.hasClass(el, 'carlos'));

      dom.addClass(el);
      assert.isTrue(dom.hasClass(el, 'carlos'));

      dom.addClass(el, {});
      assert.isTrue(dom.hasClass(el, 'carlos'));

      dom.addClass(el, ['foo']);
      assert.isTrue(dom.hasClass(el, 'carlos'));
    });

  });

  describe("removeClass", function () {
    var el;

    beforeEach(function () {
      el = createEl('div');
      dom.addClass(el, 'foobar');
      dom.addClass(el, 'johnDoe');
    });

    it("must remove the passed css classes from the passed element", function () {
      dom.removeClass(el, 'foobar');
      assert.isFalse(dom.hasClass(el, 'foobar'));
      assert.equal(el.getAttribute('class'), 'johnDoe');

      dom.removeClass(el, 'johnDoe');
      assert.isFalse(dom.hasClass(el, 'johnDoe'));
      assert.equal(el.getAttribute('class'), '');
    });

    it("must not remove anything if the passed element does not contain the passed css class", function () {
      dom.removeClass(el, 'carlos');
      assert.equal(el.getAttribute('class'), 'foobar johnDoe');
    });

    it("must not remove anything if you don't pass a valid css class", function () {
      dom.removeClass(el, []);
      dom.removeClass(el, {});
      assert.equal(el.getAttribute('class'), 'foobar johnDoe');
    });

  });

  describe("addEventListener", function () {
    it("must add an event listener to the passed el", function () {
      var el = createEl('div');
      var spy = sinon.spy();
      dom.addEventListener(el, 'mouseover', spy);

      assert.isFalse(spy.called);
      dom.dispatchEvent(el, testUtils.createMouseEvent('mouseover'));
      assert.isTrue(spy.calledOnce);
    });

    it("must to add an event listener to a list or elements", function () {
      var el = createEl('div');
      var el2 = createEl('div');
      var spy = sinon.spy();
      dom.addEventListener([el, el2], 'mouseover', spy);

      assert.isFalse(spy.called);
      dom.dispatchEvent(el, testUtils.createMouseEvent('mouseover'));
      assert.isTrue(spy.calledOnce);
      dom.dispatchEvent(el2, testUtils.createMouseEvent('mouseover'));
      assert.isTrue(spy.calledTwice);
    });

    it("must be possible to add several event listener given a list of events", function () {
      var el = createEl('div');
      var el2 = createEl('div');
      var spy = sinon.spy();
      dom.addEventListener([el, el2], ['mouseover', 'mouseout'], spy);

      assert.isFalse(spy.called);
      dom.dispatchEvent(el, testUtils.createMouseEvent('mouseover'));
      assert.isTrue(spy.calledOnce);
      dom.dispatchEvent(el2, testUtils.createMouseEvent('mouseover'));
      assert.isTrue(spy.calledTwice);
      dom.dispatchEvent(el, testUtils.createMouseEvent('mouseout'));
      assert.isTrue(spy.calledThrice);
      dom.dispatchEvent(el2, testUtils.createMouseEvent('mouseout'));
      assert.equal(spy.callCount, 4);
    });
  });

  describe("removeEventListener", function () {
    it("must remove an already registered event", function () {
      var el = createEl('div');
      var spy = sinon.spy();
      dom.addEventListener(el, 'mouseover', spy);
      dom.removeEventListener(el, 'mouseover', spy);
      el.dispatchEvent(testUtils.createMouseEvent('mouseover'));
      assert.isFalse(spy.called);
    });

    it("must remove an already registered event from a list of elements", function () {
      var el = createEl('div');
      var el2 = createEl('div');
      var spy = sinon.spy();
      dom.addEventListener([el, el2], 'mouseover', spy);
      dom.removeEventListener([el, el2], 'mouseover', spy);
      el.dispatchEvent(testUtils.createMouseEvent('mouseover'));
      assert.isFalse(spy.called);
    });

    it("must remove an already registered list of events", function () {
      var el = createEl('div');
      var el2 = createEl('div');
      var spy = sinon.spy();
      dom.addEventListener([el, el2], ['mouseover', 'mouseout'], spy);
      dom.removeEventListener([el, el2], ['mouseover', 'mouseout'], spy);
      el.dispatchEvent(testUtils.createMouseEvent('mouseover'));
      el2.dispatchEvent(testUtils.createMouseEvent('mouseover'));
      el.dispatchEvent(testUtils.createMouseEvent('mouseout'));
      el2.dispatchEvent(testUtils.createMouseEvent('mouseout'));
      assert.isFalse(spy.called);
    });
  });

  describe("dispatchEvent", function () {
    it("must trigger the passed event", function () {
      var el = createEl('div');
      var spy = sinon.spy();
      dom.addEventListener(el, 'mouseover', spy);

      dom.dispatchEvent(el, testUtils.createMouseEvent('mouseover'));
      assert.isTrue(spy.calledOnce);
    });
  });

  describe("isDescendant", function () {
    var parent, child1, child2;

    beforeEach(function () {
      parent = createEl('div');
      child1 = createEl('div');
      child2 = createEl('div');

      parent.appendChild(child1);
      parent.appendChild(child2);
    });

    it("must return true if the child is a descendant of the passed parent", function () {
      assert.isTrue(dom.isDescendant(testDiv, parent));
      assert.isTrue(dom.isDescendant(parent, child1));
      assert.isTrue(dom.isDescendant(parent, child2));
      assert.isTrue(dom.isDescendant(testDiv, child1));
    });

    it("must return false if the child is NOT a descendant of the passed parent", function () {
      assert.isFalse(dom.isDescendant(parent, testDiv));
      assert.isFalse(dom.isDescendant(child1, parent));
      assert.isFalse(dom.isDescendant(child2, parent));
      assert.isFalse(dom.isDescendant(child1, child2));
      assert.isFalse(dom.isDescendant(child2, testDiv));
    });
  });

  describe("getTextContent", function () {
    it("must return the text content of the passed element", function () {
      var textNode = document.createTextNode('Carlos');
      var input = createEl('input');
      var div = createEl('div');
      input.value = 'Carlos';
      div.innerHTML = '<div>' +
        '<span>Carlos </span>' +
        '<div><span>Serrano</span></div>' +
        '</div>';
      assert.equal(dom.getTextContent(textNode), "Carlos");
      assert.equal(dom.getTextContent(div), "Carlos Serrano");
      //NOTE: An input element does not have text it has value
      assert.equal(dom.getTextContent(input), undefined);
    });
  });

  describe("prependChild", function () {
    it("must exist", function () {
      assert.isFunction(dom.prependChild);
    });

    it("must insert the passed child on the parent node", function () {
      var child = document.createElement('div');
      var parent = document.createElement('div');
      dom.prependChild(parent, child);
      assert.isTrue(dom.isDescendant(parent, child));
    });

    it("must insert the child before the existing children", function () {
      var newNode = document.createElement('div');
      var child1 = document.createElement('div');
      var child2 = document.createElement('div');
      var parent = document.createElement('div');
      parent.appendChild(child1);
      parent.appendChild(child2);
      dom.prependChild(parent, newNode);
      assert.equal(parent.firstChild, newNode);
    });

    it("must remove the child from its parentNode before moving it to its new parent", function () {
      var child = document.createElement('div');
      var currentParent = document.createElement('div');
      var newParent = document.createElement('div');
      currentParent.appendChild(child);
      assert.isTrue(dom.isDescendant(currentParent, child));

      dom.prependChild(newParent, child);
      assert.isFalse(dom.isDescendant(currentParent, child));
    });
  });

  describe("remove", function () {
    it("must remove the passed node from the document", function () {
      var node = document.createElement('div');
      node.id = 'testElem';
      testDiv.appendChild(node);
      assert.isNotNull(document.querySelector('#testElem'));
      dom.remove(node);
      assert.isNull(document.querySelector('#testElem'));
    });
  });

  describe("isDomElement", function () {
    it("must return true if you pass a DOM element and false otherwise", function () {
      assert.isTrue(dom.isDomElement(document.createElement('div')));
      assert.isFalse(dom.isDomElement(document.createTextNode('foo text')));
      assert.isFalse(dom.isDomElement('div'));
      assert.isFalse(dom.isDomElement({}));
      assert.isFalse(dom.isDomElement(null));
      assert.isFalse(dom.isDomElement(undefined));
      assert.isFalse(dom.isDomElement(123));
    });

  });

  describe("click", function () {
    it("must execute the handler whenever the user clicks on the element", function () {
      var anchor = createEl('a');
      var spy = sinon.spy();
      dom.click(anchor, spy);
      anchor.click();
      sinon.assert.calledOnce(spy);
    });
  });

  describe("once", function () {
    it("must register a listener to the specified event type", function () {
      var el = createEl('div');
      var spy = sinon.spy();
      dom.once(el, 'mouseover', spy);

      assert.isFalse(spy.called);
      dom.dispatchEvent(el, testUtils.createMouseEvent('mouseover'));
      assert.isTrue(spy.calledOnce);
    });

    it("must remove the listener once the event have been triggered", function () {
      var el = createEl('div');
      var spy = sinon.spy();
      dom.once(el, 'mouseover', spy);

      dom.dispatchEvent(el, testUtils.createMouseEvent('mouseover'));
      dom.dispatchEvent(el, testUtils.createMouseEvent('mouseover'));
      dom.dispatchEvent(el, testUtils.createMouseEvent('mouseover'));
      dom.dispatchEvent(el, testUtils.createMouseEvent('mouseover'));
      sinon.assert.calledOnce(spy);
    });
  });

  describe("getDimension", function(){
    it("must return de width and the height of the passed element", function(){
      var el = createEl('div');
      dom.addClass(el, 'ten-px-square');
      assert.deepEqual(dom.getDimension(el), {width: 30, height: 30});
    });
  });
});

