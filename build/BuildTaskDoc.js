'use strict';

module.exports = function BuildTaskDoc(name, description, order) {
    this.name = name;
    this.description = description;
    this.order = order || 100;
};