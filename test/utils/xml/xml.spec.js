var xml = require('utils/xml');

describe("xml", function () {
  it("must be an object", function () {
    assert.isObject(xml);
  });

  describe("strToXMLDoc", function(){
    it("must throw an exception if it encounters a problem parsing the xml", function(){
      assert.throws(function () {
        xml.strToXMLDoc('');
      }, Error, "Error parsing the string: ''");

      assert.throws(function () {
        xml.strToXMLDoc();
      }, Error, "Error parsing the string: 'undefined'");

      assert.throws(function () {
        xml.strToXMLDoc({});
      }, Error, "Error parsing the string: '[object Object]'");
    });

    it("must, given an xml string, return an equivalent XML document object", function(){
      var doc = xml.strToXMLDoc('<employee type="usher">John Smith</employee>');
      var employeeNode;
      assert.isTrue(doc.hasChildNodes());
      assert.equal(doc.childNodes.length, 1);

      employeeNode = doc.childNodes.item(0);
      assert.equal(employeeNode.nodeName.toLowerCase(), 'employee');
      assert.isTrue(employeeNode.hasAttributes());
      assert.equal(employeeNode.attributes.length, 1);
      assert.equal(employeeNode.attributes.item(0).name,'type');
      assert.equal(employeeNode.attributes.item(0).value,'usher');
      assert.isTrue(employeeNode.hasChildNodes());
      assert.equal(employeeNode.childNodes.length, 1);
      assert.isFalse(employeeNode.childNodes.item(0).hasChildNodes());
      assert.equal(employeeNode.childNodes.item(0).data, 'John Smith');
    });
  });

  describe("parseText", function () {
    it("must return null if you pass an empty string or a string full of spaces", function () {
      assert.equal(xml.parseText(''), null);
      assert.equal(xml.parseText('   '), null);
    });

    it("must return true if you pass 'true' or 'TRUE'", function () {
      assert.equal(xml.parseText('true'), true);
      assert.equal(xml.parseText('TRUE'), true);
    });

    it("must return false if you pass 'false' or 'FALSE'", function () {
      assert.equal(xml.parseText('false'), false);
      assert.equal(xml.parseText('FALSE'), false);
    });

    it("must return a number if you pass a number string", function () {
      assert.equal(xml.parseText('123'), 123);
      assert.equal(xml.parseText('123.123'), 123.123);
    });

    it("must return a date if you pass an ISO 8601 date", function () {
      var now = new Date();
      assert.equal(xml.parseText(now.toISOString()).getTime(), now.getTime());
    });

    //Regression text
    it("must return a string if you pass a percentage", function(){
      assert.equal(xml.parseText('10%'), '10%');
    });
  });

  describe("JXONTree", function(){

    it("must be a function constructor function", function(){
      var xmlDoc = xml.strToXMLDoc('<item_number type="string" custom_attr="foo"></item_number>');
      assert.isFunction(xml.JXONTree);
      assert.instanceOf(new xml.JXONTree(xmlDoc), xml.JXONTree);
    });

    describe("on text node type", function(){
      var jxonTree;

      beforeEach(function(){
        jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"><![CDATA[QWZ5671]]></item_number>');
      });

      it("must publish its value in the 'keyValue' field", function(){
        assert.equal(jxonTree.keyValue, 'QWZ5671');
      });

      it("must publish its attributs with using '@' as a prefix", function(){
        assert.equal(jxonTree['@type'], 'string');
        assert.equal(jxonTree['@custom_attr'], 'foo');
      });

      it("must extract the value from the <![CDATA[ ... ]]>", function(){
        jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"><![CDATA[QWZ5671]]></item_number>');
        assert.equal(jxonTree.keyValue, 'QWZ5671');
      });

      it("must return undefined if the element is empty", function(){
        jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"></item_number>');
        assert.isUndefined(jxonTree.keyValue);

        jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"><![CDATA[]]></item_number>');
        assert.isUndefined(jxonTree.keyValue);
      });

      it("must convert number elements", function(){
        jxonTree = xml.toJXONTree('<item_number type="number">4321</item_number>');
        assert.strictEqual(jxonTree.keyValue, 4321);
      });

      it("must convert ISO8601 Date strings into actual date objects", function(){
        var now = new Date();
        jxonTree = xml.toJXONTree('<item_number type="number">'+now.toISOString()+'</item_number>');
        assert.equal(jxonTree.keyValue.getTime(), now.getTime());
      });

      it("must convert boolean values", function(){
        assert.isTrue(xml.toJXONTree('<item_bool>true</item_bool>').keyValue);
        assert.isFalse(xml.toJXONTree('<item_bool>false</item_bool>').keyValue);
      });

      it("must work with single tag elems", function(){
        jxonTree = xml.toJXONTree('<Extension type="waterfall" fallback_index="0"/>');
        assert.equal(jxonTree.attr('type'), 'waterfall');
        assert.equal(jxonTree.attr('fallback_index'), 0);
      });

      it("must set empty attributes as null", function(){
        assert.equal(xml.toJXONTree('<item_bool id="">true</item_bool>')["@id"], null);
      });
    });

    describe("on element node type", function(){
      var jxonTree;

      beforeEach(function(){
        var sampleXml = '<root>' +
                            '<item_number type="string" ><![CDATA[QWZ5671]]></item_number>' +
                            '<item_number type="string" ><![CDATA[QWZ5672]]></item_number>' +
                            '<price currency="dollar">1234</price>'+
                        '</root>';
        var xmlDoc = xml.strToXMLDoc(sampleXml);
        jxonTree = new xml.JXONTree(xmlDoc);
      });

      it("must have a field for each tag element type", function(){
        assert.isDefined(jxonTree.item_number);
        assert.isDefined(jxonTree.price);
      });

      it("must publish all the child of the same type (tagname) on an array ", function(){
        assert.isArray(jxonTree.item_number);
        assert.equal(jxonTree.item_number.length, 2);

        assert.equal(jxonTree.item_number[0].keyValue, "QWZ5671");
        assert.equal(jxonTree.item_number[0].attr('type'), "string");

        assert.equal(jxonTree.item_number[1].keyValue, "QWZ5672");
        assert.equal(jxonTree.item_number[1].attr('type'), "string");
      });

      it("must publish single childs as the object itself", function(){
        assert.equal(jxonTree.price.keyValue, 1234);
        assert.equal(jxonTree.price.attr('currency'), 'dollar');
      });
    });

    describe("attr", function(){
      it("must return the value of the atrr", function(){
        var jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"><![CDATA[QWZ5671]]></item_number>');
        assert.equal('string', jxonTree.attr('type'));
        assert.equal('foo', jxonTree.attr('custom_attr'));
      });
    });
  });

  describe("toJXONTree", function(){
    it("must given a xml string, return a JXONTree object with the xml content", function(){
      var jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="fooo"><![CDATA[QWZ5671]]></item_number>');
        assert.equal(jxonTree.keyValue, 'QWZ5671');
        assert.equal(jxonTree['@type'], 'string');
        assert.equal(jxonTree['@custom_attr'], 'fooo');
    });

    //Regression test
    it("must properly parse pecentage strings", function(){
      var jxonTree = xml.toJXONTree('<item_number custom_attr="10%">90%</item_number>');
        assert.equal(jxonTree.keyValue, '90%');
        assert.equal(jxonTree['@custom_attr'], '10%');
    });
  });

  describe("keyValue", function(){
    it("must return the key value of the passed JXONTree obj", function(){
      var jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"><![CDATA[QWZ5671]]></item_number>');
      assert.equal('QWZ5671', xml.keyValue(jxonTree));
    });

    it("must return undefined if the passed obje does not have a keyvalue", function(){
      assert.isUndefined(xml.keyValue());
      assert.isUndefined(xml.keyValue({}));
    });
  });

  describe("attr", function(){
    it("must return the value of the attr on the passed obj", function(){
      var jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"><![CDATA[QWZ5671]]></item_number>');
      assert.equal('string', xml.attr(jxonTree, 'type'));
      assert.equal('foo', xml.attr(jxonTree, 'custom_attr'));
    });
  });

  describe("encode", function(){
    it("must return undefined when is not passed a string", function() {
      assert.isUndefined(xml.encode());
      assert.isUndefined(xml.encode({}));
    });

    it("must encode &, \", ', < and >", function(){
      assert.equal(xml.encode("<br/> \"'"), '&lt;br/&gt; &quot;&apos;' );
    });
  });

  describe("decode", function(){
    it("must return undefined when is not passed a string", function() {
      assert.isUndefined(xml.decode());
      assert.isUndefined(xml.decode({}));
    });

    it("must edcode a previously encoded xml", function(){
      assert.equal(xml.decode('&lt;br/&gt; &quot;&apos;'), "<br/> \"'");
    });
  });
});
