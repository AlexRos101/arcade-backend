# ArcadeDoge Backend

This is the backend of ArcadeDoge system.
This backend synchronizes blockchain datas in real time and provide apis to be called from frontend and individual games which are supported by ArcadeDoge system.

## Installation

Install the packages using:

```js
npm install
```

## Start

Start the backend using:

```js
node index.js
```

## How to start the backend as daemon

* Using `setsid`

Run below command to start the backend as daemon

```js
setsid >/dev/null node index.js
```

* Using `screen`

Run below command to start the backend as daemon

```js
screen -a
node index.js
```

If you want to escape from screen, press `Ctrl`+`A`+`D`
