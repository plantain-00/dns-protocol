[![Dependency Status](https://david-dm.org/plantain-00/dns-protocol.svg)](https://david-dm.org/plantain-00/dns-protocol)
[![devDependency Status](https://david-dm.org/plantain-00/dns-protocol/dev-status.svg)](https://david-dm.org/plantain-00/dns-protocol#info=devDependencies)
[![Build Status: Linux](https://travis-ci.org/plantain-00/dns-protocol.svg?branch=master)](https://travis-ci.org/plantain-00/dns-protocol)
[![Build Status: Windows](https://ci.appveyor.com/api/projects/status/github/plantain-00/dns-protocol?branch=master&svg=true)](https://ci.appveyor.com/project/plantain-00/dns-protocol/branch/master)
[![npm version](https://badge.fury.io/js/dns-protocol.svg)](https://badge.fury.io/js/dns-protocol)
[![Downloads](https://img.shields.io/npm/dm/dns-protocol.svg)](https://www.npmjs.com/package/dns-protocol)

# dns-protocol
A Library to encode and parse data for DNS protocol.

#### install

`yarn add dns-protocol`

#### usage

```ts
import Message, { MessageType } from "dns-protocol/nodejs/nodejs";
// import Message, { MessageType } from "dns-protocol/browser/browser";
// <script src="./node_modules/dns-protocol/dns-protocol.min.js"></script>

// construct request
const request = new Message(43825);
request.addQuestion("www.example.com");

// encode request
const encodedRequest = request.encode(); // [0xab, 0x31, 0x01, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x77, 0x77, 0x77, 0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00, 0x00, 0x01, 0x00, 0x01]

// parse encoded request
const decodedRequest = Message.parse(encodedRequest.buffer);

// construct response
decodedRequest.type = MessageType.response;
decodedRequest.recursionAvailable = true;
decodedRequest.addAnswer("www.example.com", 20680, "93.184.216.34");

// encode response
const encodedAnswer = decodedRequest.encode(); // [0xab, 0x31, 0x81, 0x80, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x03, 0x77, 0x77, 0x77, 0x07, 0x65, 0x78, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00, 0x00, 0x01, 0x00, 0x01, 0xc0, 0x0c, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x50, 0xc8, 0x00, 0x04, 0x5d, 0xb8, 0xd8, 0x22]

// parse encoded response
const decodedAnswer = Message.parse(encodedAnswer.buffer as ArrayBuffer);
```
