(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/jankrems/Projects/bugger/bugger-daemon/ui/views/root.jsx":[function(require,module,exports){
/** @jsx React.DOM */
'use strict';

var React = require('react');

var Launcher = React.createClass({displayName: 'Launcher',
  handleSubmit:function(e) {
    if (e) e.preventDefault();
    var cwd = this.refs.cwd.state.value;
    var script = this.refs.script.state.value;

    var xhr = new XMLHttpRequest(), self = this;
    xhr.addEventListener('load', function() {
      console.log('created!', xhr.responseText);
    });
    xhr.addEventListener('error', function() {
      console.log('error!');
    });
    xhr.open('post', '/json/new', true);
    xhr.send();
  },

  render:function() {
    return React.DOM.form({onSubmit: this.handleSubmit}, 
      React.DOM.input({type: "text", name: "cwd", ref: "cwd", defaultValue: "/tmp/buggers"}), 
      React.DOM.input({type: "text", name: "script", ref: "script", defaultValue: "ok.js"}), 
      React.DOM.button({type: "submit"}, "Launch!")
    );
  }
});

var ProcessList = React.createClass({displayName: 'ProcessList',
  renderProcess:function(proc) {
    return React.DOM.li({key: proc.port}, React.DOM.dl(null, 
      React.DOM.dt(null, 'worker-shim.js', ' - ', React.DOM.em(null, "4256")), 
      React.DOM.dd(null, React.DOM.a({href: "#"}, 'Link to DevTools')), 
      React.DOM.dd(null, React.DOM.pre(null, React.DOM.code(null, 
        '$ cd ~/foo && \\\n  node --debug-brk=' + proc.port + ' worker-shim.js'
      )))
    ));
  },

  render:function() {
    return React.DOM.ul(null, this.props.items.map(this.renderProcess));
  }
});

var Root = React.createClass({displayName: 'Root',
  render:function() {
    var processes = [
      { port: 5858 }
    ];

    return React.DOM.div({className: "content"}, 
      React.DOM.h1(null, "Running processes"), 
      Launcher(null), 
      ProcessList({items: processes})
    );
  }
});

module.exports = Root;

},{"react":"react"}],"/Users/jankrems/Projects/bugger/bugger-daemon":[function(require,module,exports){
/* jshint browser:true */
'use strict';

var React = require('react');
var Root = require('./views/root.jsx');

React.renderComponent(
  new Root(), document.getElementById('root'));

},{"./views/root.jsx":"/Users/jankrems/Projects/bugger/bugger-daemon/ui/views/root.jsx","react":"react"}]},{},["/Users/jankrems/Projects/bugger/bugger-daemon"]);
