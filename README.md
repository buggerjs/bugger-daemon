# bugger-daemon

[![Build Status](https://travis-ci.org/buggerjs/bugger-daemon.png)](https://travis-ci.org/buggerjs/bugger-daemon)

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

## API

This is meant to be (roughly) compatible with the API Chrome exposes.


### GET /json/version

*Note: This endpoint works using any HTTP method to be compatible with Chrome.*

```json
{
  Browser: "Chrome/37.0.2062.124",
  Protocol-Version: "1.1",
  User-Agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36",
  WebKit-Version: "537.36 (@181352)"
}
```


### GET /json, GET /json/list

*Note: This endpoint works using any HTTP method to be compatible with Chrome.*

```json
[ {
  description: "",
  devtoolsFrontendUrl: "/devtools/devtools.html?ws=localhost:9222/devtools/page/961C1EB7-A0DA-2F42-F6D4-76B453E70DB5",
  faviconUrl: "https://s.yimg.com/rz/l/favicon.ico",
  id: "961C1EB7-A0DA-2F42-F6D4-76B453E70DB5",
  title: "Yahoo",
  type: "page",
  url: "https://www.yahoo.com/",
  webSocketDebuggerUrl: "ws://localhost:9222/devtools/page/961C1EB7-A0DA-2F42-F6D4-76B453E70DB5"
} ]
```


### POST /json/new?{url}

*Note: This endpoint works using any HTTP method to be compatible with Chrome.*

It responds with a description of the newly spawned process.
The format is the same as one element in the array returned by `/json`.

The url is a "bugger url".
Which obviously isn't *really* a thing but it's relatively straight-forward:

    bugger://{cwd}:{script}

The working directory may be an absolute path (`/tmp/foo`)
or anything that can be resolved globally (`~/Projects/xyz`).
The script will be resolved relative to the working directory.

In the future it might be good to also support arguments,
either via query or via POST body.


### POST /json/activate/{pageId}

*Note: This endpoint works using any HTTP method to be compatible with Chrome.*

In Chrome this would bring a page into the foreground (activate a tab).
Since this doesn't make a lot of sense for UI-less node processes,
it's a noop.

If the target is invalid, responds with 404 and a string like this:

```json
"No such target id: {pageId}"
```

For valid targets the response is 200, `"Target activated"`.


### POST /json/close/{pageId}

*Note: This endpoint works using any HTTP method to be compatible with Chrome.*

Removes the script identifed by `pageId`.
If the process is running currently, it will be killed.

If the target is invalid, responds with 404 and a string like this:

```json
"No such target id: {pageId}"
```

For valid targets the response is 200, `"Target is closing"`.


### Websocket /devtools/page/{pageId}

This is where the devtools are connecting to.


### GET /devtools/*

A copy of the devtools that ship with Chrome.
