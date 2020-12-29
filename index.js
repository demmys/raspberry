const dgram = require('dgram');
const express = require('express');
const { Device } = require('ps4-waker');

const SERVER_PORT = 3388;
const PROJECT_ID = 'raspberry-e8f40';
const DISCOVERY_PACKET = 'HelloLocalHomeSDK';
const DEVICE_ID = 'device123';
const DISCOVERY_PORT_OUT = 3311;

const udpServer = dgram.createSocket('udp4');
udpServer.on('message', (msg, rinfo) => {
  console.log(`Got [${msg}] from ${rinfo.address}`);
  if (msg != DISCOVERY_PACKET) return;

  udpServer.send(DEVICE_ID, rinfo.port, rinfo.address, () => {
    console.log(`Done sending [${DEVICE_ID}] to ${rinfo.address}:${rinfo.port}`);
  });
});
udpServer.on('error', (err) => {
  logger.error(`UDP Server error: ${err.message}`);
});
udpServer.on('listening', () => {
  console.log(`UDP Server listening on ${DISCOVERY_PORT_OUT}`);
});
udpServer.bind(DISCOVERY_PORT_OUT);

// Start the HTTP server
const server = express();
server.use(express.json());
server.post('/', function(req, res) {
  console.log(JSON.stringify(req.body, null, 2));
  (async () => {
    if ('on' in req.body) {
      let ps4 = new Device();
      if (req.body.on === true) {
        ps4.turnOn();
      } else {
        ps4.turnOff();
      }
      ps4.close();
    }
    if ('currentApplication' in req.body) {
      let ps4 = new Device();
      if (req.body.currentApplication === 'HOME') {
        ps4.sendKeys(['ps']);
      } else {
        ps4.startTitle(req.body.currentApplication);
      }
      ps4.close();
    }
    res.send('OK');
  })().catch((err) => {
    res.status(500).send(JSON.stringify(err, null, 2));
  });
});
server.listen(SERVER_PORT, () => console.log(`Device listening on port ${SERVER_PORT}`));
