/** @jsx React.DOM */
'use strict';

var React = require('react');

var Launcher = React.createClass({
  handleSubmit(e) {
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
    var cwd = proc.url.replace('bugger://', '').split(':')[0];
    return <li key={proc.id}><dl>
      <dt>{proc.title}{' - '}<em>{proc.pid || '?'}</em></dt>
      <dd><a href={proc.devtoolsFrontendUrl}>{'Open in DevTools'}</a></dd>
      <dd><pre><code>
        {'$ cd ' + cwd + ' && \\\n  node --debug-brk=' + (proc.port || 5858) + ' ' + proc.title}
      </code></pre></dd>
    </dl></li>;
  },

  render() {
    return <ul>{this.props.items.map(this.renderProcess)}</ul>;
  }
});

var Root = React.createClass({
  getInitialState() {
    return { processes: [] };
  },

  updateProcessList() {
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

  componentWillMount() {
    this.updateProcessList();
  },

  render() {
    var processes = this.state.processes;

    return <div className="content">
      <h1>Running processes</h1>
      <Launcher onLaunched={this.updateProcessList} />
      <ProcessList items={processes} />
    </div>;
  }
});

module.exports = Root;
