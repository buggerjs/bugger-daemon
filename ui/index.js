/* jshint browser:true */
'use strict';

var React = require('react');
var Root = require('./views/root.jsx');

React.renderComponent(
  new Root(), document.getElementById('root'));
