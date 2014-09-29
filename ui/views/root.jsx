/** @jsx React.DOM */
'use strict';

var React = require('react');

var Launcher = React.createClass({
  handleSubmit(e) {
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

  render() {
    return <form onSubmit={this.handleSubmit}>
      <input type="text" name="cwd" ref="cwd" defaultValue="/tmp/buggers" />
      <input type="text" name="script" ref="script" defaultValue="ok.js" />
      <button type="submit">Launch!</button>
    </form>;
  }
});

var ProcessList = React.createClass({
  renderProcess(proc) {
    return <li key={proc.port}><dl>
      <dt>{'worker-shim.js'}{' - '}<em>4256</em></dt>
      <dd><a href="#">{'Link to DevTools'}</a></dd>
      <dd><pre><code>
        {'$ cd ~/foo && \\\n  node --debug-brk=' + proc.port + ' worker-shim.js'}
      </code></pre></dd>
    </dl></li>;
  },

  render() {
    return <ul>{this.props.items.map(this.renderProcess)}</ul>;
  }
});

var Root = React.createClass({
  render() {
    var processes = [
      { port: 5858 }
    ];

    return <div className="content">
      <h1>Running processes</h1>
      <Launcher />
      <ProcessList items={processes} />
    </div>;
  }
});

module.exports = Root;
