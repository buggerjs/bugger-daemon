# bugger-daemon

Main point of communication/integration between the many moving parts of
bugger.

* Any process being bugger'd will register with buggerd
* Instrumentation code will communicate with buggerd
* The Chrome extension will ask buggerd for information about running procs
* All DevTools will communicate via websocket with buggerd

## ASCII art time

```

  --------------------------- Chrome ---------------------------
 |                    |                    |                    |
 |     DevTools A     |     DevTools B     |     bugger.crx     |
 |         |          |         |          |         |          |
  ---------|--------------------|--------------------|----------
           |                    |                    |
           | (I)                | (I)                | (II)
           |                    |                    |
  ---------|---------------- buggerd ----------------|----------
 |         V          |         V          |         V          |
 |  Domain Agents A   |   Domain Agents B  |   Meta HTTP API    |
 |        |           |               \    |         Δ          |
  --------|----------------------------\-------------|----------
          |                             \            |
          | (III)                        | (III)     |
          |             _________________|__________/| (II)*
          V            /                 V           |
      ------- A.js ---/---             ------- B.js -|------
     |               /    |           |              |      |
     |  Instrumentation   |           |   Instrumentation   |
     |                    |           |                     |
      --------------------             ---------------------

(I)   Chrome Remote Debugging Protocol // websocket
      https://developers.google.com/chrome-developer-tools/docs/protocol/1.0/

(II)  REST API for basic meta data about debugged processes (see below)

(II)* The instrumentation code may also communicate directly with the domain
      agents if necessary.

(III) v8 debugger protocol
      https://code.google.com/p/v8/wiki/DebuggerProtocol
```

## META HTTP API

### GET /processes

Array with all known processes. See next section for schema.

### GET /processes/:pid

Get information about a process with a given PID. Will only work if the
process was instrumented previously. Data will look like this:

```json
{
  "title": "some_script.js param1 --num=10",
  "script": "some_script.js",
  "params": [ "param1", "--num=10" ],
  "pid": 70491,
  "pwd": "/home/jdoe/workspace/tools",
  "websocket": "/processes/70491/websocket"
}
```

### DELETE /processes/:pid

Unregister a process.

### PUT /processes/:pid

Used by instrumentation to register a new process. It expects JSON data in the
body that looks like the one shown in the GET request, only without title.

### GET /processes/:pid [Upgrade: websocket]

Websocket that the devtools can connect to. If buggerd is running at
http://127.0.0.1:8058 (which is the default), then the proper devtools url
for a process with PID 70491 would be:

chrome-devtools://devtools/devtools.html?ws=127.0.0.1:8058/processes/70491&toolbarColor=rgba(230,230,230,1)&textColor=rgba(0,0,0,1)

### GET /processes/:pid/source-maps/:mapId

Get the content of a source map.
