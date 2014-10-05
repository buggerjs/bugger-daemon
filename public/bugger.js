(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/jankrems/Projects/bugger/bugger-daemon/ui/views/root.jsx":[function(require,module,exports){
/** @jsx React.DOM */
'use strict';

var React = require('react');

var Launcher = React.createClass({displayName: 'Launcher',
  handleSubmit:function(e) {
    if (e) e.preventDefault();
    var cwd = this.refs.cwd.state.value;
    var script = this.refs.script.state.value;
    var buggerUrl = 'bugger://' + cwd + ':' + script;

    var xhr = new XMLHttpRequest(), self = this;
    xhr.addEventListener('load', function() {
      if (self.props.onLaunched) {
        self.props.onLaunched();
      }
    });
    xhr.addEventListener('error', function() {
      console.log('error!');
    });
    xhr.open('post', '/json/new?' + buggerUrl, true);
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
    var cwd = proc.url.replace('bugger://', '').split(':')[0];
    var pid = proc.url.split('#')[1] || '?';
    return React.DOM.li({key: proc.id}, React.DOM.dl(null, 
      React.DOM.dt(null, proc.title, ' - ', React.DOM.em(null, pid)), 
      React.DOM.dd(null, React.DOM.a({href: proc.devtoolsFrontendUrl}, 'Open in DevTools')), 
      React.DOM.dd(null, React.DOM.pre(null, React.DOM.code(null, 
        '$ cd ' + cwd + ' && \\\n  node --debug-brk=' + (proc.port || 5858) + ' ' + proc.title
      )))
    ));
  },

  render:function() {
    return React.DOM.ul(null, this.props.items.map(this.renderProcess));
  }
});

var Root = React.createClass({displayName: 'Root',
  getInitialState:function() {
    return { processes: [] };
  },

  updateProcessList:function() {
    var xhr = new XMLHttpRequest(), self = this;
    xhr.addEventListener('load', function() {
      if (xhr.statusText !== 'OK') {
        console.error(xhr.statusText);
        return;
      }
      self.setState({
        processes: JSON.parse(xhr.responseText)
      });
    });
    xhr.addEventListener('error', function() {
      console.log('error!');
    });
    xhr.open('get', '/json/list', true);
    xhr.send();
  },

  componentWillMount:function() {
    this.updateProcessList();
  },

  render:function() {
    var processes = this.state.processes;

    return React.DOM.div({className: "content"}, 
      React.DOM.h1(null, "Running processes"), 
      Launcher({onLaunched: this.updateProcessList}), 
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
