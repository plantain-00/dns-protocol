import * as dgram from "dgram";
import Message, { MessageType } from "../dist/nodejs/nodejs";

const server = dgram.createSocket("udp4");

// tslint:disable:no-console

server.on("message", (msg, rinfo) => {
    const request = Message.parse(msg.buffer as ArrayBuffer);
    console.log(request);

    if (request.questions.length > 0) {
        if (request.questions[0].questionName === "www.example.com") {
            request.type = MessageType.response;
            request.recursionAvailable = true;
            request.addAnswer("www.example.com", 20680, "93.184.216.34");

            const answer = request.encode();
            server.send(new Buffer(answer.buffer as ArrayBuffer), rinfo.port, rinfo.address);
        }
    }
});

server.on("listening", () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(53);
