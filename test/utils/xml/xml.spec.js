const xml = require('../../../src/scripts/utils/xml');

describe('xml', () => {
  it('must be an object', () => {
    assert.isObject(xml);
  });

  describe('strToXMLDoc', () => {
    it('must throw an exception if it encounters a problem parsing the xml', () => {
      assert.throws(() => {
        xml.strToXMLDoc('');
      }, Error, 'Error parsing the string: \'\'');

      assert.throws(() => {
        xml.strToXMLDoc();
      }, Error, 'Error parsing the string: \'undefined\'');

      assert.throws(() => {
        xml.strToXMLDoc({});
      }, Error, 'Error parsing the string: \'[object Object]\'');
    });

    it('must, given an xml string, return an equivalent XML document object', () => {
      const doc = xml.strToXMLDoc('<employee type="usher">John Smith</employee>');
      const employeeNode = doc.childNodes.item(0);

      assert.isTrue(doc.hasChildNodes());
      assert.equal(doc.childNodes.length, 1);

      assert.equal(employeeNode.nodeName.toLowerCase(), 'employee');
      assert.isTrue(employeeNode.hasAttributes());
      assert.equal(employeeNode.attributes.length, 1);
      assert.equal(employeeNode.attributes.item(0).name, 'type');
      assert.equal(employeeNode.attributes.item(0).value, 'usher');
      assert.isTrue(employeeNode.hasChildNodes());
      assert.equal(employeeNode.childNodes.length, 1);
      assert.isFalse(employeeNode.childNodes.item(0).hasChildNodes());
      assert.equal(employeeNode.childNodes.item(0).data, 'John Smith');
    });
  });

  describe('parseText', () => {
    it('must return null if you pass an empty string or a string full of spaces', () => {
      assert.equal(xml.parseText(''), null);
      assert.equal(xml.parseText('   '), null);
    });

    it('must return true if you pass \'true\' or \'TRUE\'', () => {
      assert.equal(xml.parseText('true'), true);
      assert.equal(xml.parseText('TRUE'), true);
    });

    it('must return false if you pass \'false\' or \'FALSE\'', () => {
      assert.equal(xml.parseText('false'), false);
      assert.equal(xml.parseText('FALSE'), false);
    });

    it('must return a number if you pass a number string', () => {
      assert.equal(xml.parseText('123'), 123);
      assert.equal(xml.parseText('123.123'), 123.123);
    });

    it('must return a date if you pass an ISO 8601 date', () => {
      const now = new Date();

      assert.equal(xml.parseText(now.toISOString()).getTime(), now.getTime());
    });

    // Regression text
    it('must return a string if you pass a percentage', () => {
      assert.equal(xml.parseText('10%'), '10%');
    });
  });

  describe('JXONTree', () => {
    it('must be a function constructor function', () => {
      const xmlDoc = xml.strToXMLDoc('<item_number type="string" custom_attr="foo"></item_number>');

      assert.isFunction(xml.JXONTree);
      assert.instanceOf(new xml.JXONTree(xmlDoc), xml.JXONTree);
    });

    describe('on text node type', () => {
      let jxonTree;

      beforeEach(() => {
        jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"><![CDATA[QWZ5671]]></item_number>');
      });

      it('must publish its value in the \'keyValue\' field', () => {
        assert.equal(jxonTree.keyValue, 'QWZ5671');
      });

      it('must publish its attributs with using \'@\' as a prefix', () => {
        assert.equal(jxonTree['@type'], 'string');
        assert.equal(jxonTree['@custom_attr'], 'foo');
      });

      it('must extract the value from the <![CDATA[ ... ]]>', () => {
        jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"><![CDATA[QWZ5671]]></item_number>');
        assert.equal(jxonTree.keyValue, 'QWZ5671');
      });

      it('must return undefined if the element is empty', () => {
        jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"></item_number>');
        assert.isUndefined(jxonTree.keyValue);

        jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"><![CDATA[]]></item_number>');
        assert.isUndefined(jxonTree.keyValue);
      });

      it('must convert number elements', () => {
        jxonTree = xml.toJXONTree('<item_number type="number">4321</item_number>');
        assert.strictEqual(jxonTree.keyValue, 4321);
      });

      it('must convert ISO8601 Date strings into actual date objects', () => {
        const now = new Date();

        jxonTree = xml.toJXONTree('<item_number type="number">' + now.toISOString() + '</item_number>');
        assert.equal(jxonTree.keyValue.getTime(), now.getTime());
      });

      it('must convert boolean values', () => {
        assert.isTrue(xml.toJXONTree('<item_bool>true</item_bool>').keyValue);
        assert.isFalse(xml.toJXONTree('<item_bool>false</item_bool>').keyValue);
      });

      it('must work with single tag elems', () => {
        jxonTree = xml.toJXONTree('<Extension type="waterfall" fallback_index="0"/>');
        assert.equal(jxonTree.attr('type'), 'waterfall');
        assert.equal(jxonTree.attr('fallback_index'), 0);
      });

      it('must set empty attributes as null', () => {
        assert.equal(xml.toJXONTree('<item_bool id="">true</item_bool>')['@id'], null);
      });
    });

    describe('on element node type', () => {
      let jxonTree;

      beforeEach(() => {
        const sampleXml = '<root>' +
                            '<item_number type="string" ><![CDATA[QWZ5671]]></item_number>' +
                            '<item_number type="string" ><![CDATA[QWZ5672]]></item_number>' +
                            '<price currency="dollar">1234</price>' +
                        '</root>';
        const xmlDoc = xml.strToXMLDoc(sampleXml);

        jxonTree = new xml.JXONTree(xmlDoc);
      });

      it('must have a field for each tag element type', () => {
        assert.isDefined(jxonTree.item_number);
        assert.isDefined(jxonTree.price);
      });

      it('must publish all the child of the same type (tagname) on an array ', () => {
        assert.isArray(jxonTree.item_number);
        assert.equal(jxonTree.item_number.length, 2);

        assert.equal(jxonTree.item_number[0].keyValue, 'QWZ5671');
        assert.equal(jxonTree.item_number[0].attr('type'), 'string');

        assert.equal(jxonTree.item_number[1].keyValue, 'QWZ5672');
        assert.equal(jxonTree.item_number[1].attr('type'), 'string');
      });

      it('must publish single childs as the object itself', () => {
        assert.equal(jxonTree.price.keyValue, 1234);
        assert.equal(jxonTree.price.attr('currency'), 'dollar');
      });
    });

    describe('attr', () => {
      it('must return the value of the atrr', () => {
        const jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"><![CDATA[QWZ5671]]></item_number>');

        assert.equal('string', jxonTree.attr('type'));
        assert.equal('foo', jxonTree.attr('custom_attr'));
      });
    });
  });

  describe('toJXONTree', () => {
    it('must given a xml string, return a JXONTree object with the xml content', () => {
      const jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="fooo"><![CDATA[QWZ5671]]></item_number>');

      assert.equal(jxonTree.keyValue, 'QWZ5671');
      assert.equal(jxonTree['@type'], 'string');
      assert.equal(jxonTree['@custom_attr'], 'fooo');
    });

    // Regression test
    it('must properly parse pecentage strings', () => {
      const jxonTree = xml.toJXONTree('<item_number custom_attr="10%">90%</item_number>');

      assert.equal(jxonTree.keyValue, '90%');
      assert.equal(jxonTree['@custom_attr'], '10%');
    });
  });

  describe('keyValue', () => {
    it('must return the key value of the passed JXONTree obj', () => {
      const jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"><![CDATA[QWZ5671]]></item_number>');

      assert.equal('QWZ5671', xml.keyValue(jxonTree));
    });

    it('must return undefined if the passed obje does not have a keyvalue', () => {
      assert.isUndefined(xml.keyValue());
      assert.isUndefined(xml.keyValue({}));
    });
  });

  describe('attr', () => {
    it('must return the value of the attr on the passed obj', () => {
      const jxonTree = xml.toJXONTree('<item_number type="string" custom_attr="foo"><![CDATA[QWZ5671]]></item_number>');

      assert.equal('string', xml.attr(jxonTree, 'type'));
      assert.equal('foo', xml.attr(jxonTree, 'custom_attr'));
    });
  });

  describe('encode', () => {
    it('must return undefined when is not passed a string', () => {
      assert.isUndefined(xml.encode());
      assert.isUndefined(xml.encode({}));
    });

    it('must encode &, ", \', < and >', () => {
      assert.equal(xml.encode('<br/> "\''), '&lt;br/&gt; &quot;&apos;');
    });
  });

  describe('decode', () => {
    it('must return undefined when is not passed a string', () => {
      assert.isUndefined(xml.decode());
      assert.isUndefined(xml.decode({}));
    });

    it('must edcode a previously encoded xml', () => {
      assert.equal(xml.decode('&lt;br/&gt; &quot;&apos;'), '<br/> "\'');
    });
  });
});
