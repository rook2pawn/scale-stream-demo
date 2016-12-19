scale stream demo
=================

Watch the throughput of a 1 to many connected clients all uploading lots of data to a central hub!

Install
--------

    npm install
    npm run build
    node server.js 

    // open browser to http://localhost:5555


What this does
--------------

Spawns a central server that has a single POST handler. Then a swarm is produced that spawns random alphanumeric strings that POST
to that address. The number in that swarm is also dictated by the web controls. The throughput is checked periodically and send over the wire
through the webserver.

Screenshot
-----------

![screenshot](https://github.com/rook2pawn/scale-stream-demo/screenshot.png "screenshot")
