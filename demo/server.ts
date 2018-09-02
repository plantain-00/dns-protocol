import * as dgram from 'dgram'
import Message, { MessageType, ReturnCode } from '../dist/nodejs'
import { AddressInfo } from 'net'

const server = dgram.createSocket('udp4')

server.on('message', (msg, rinfo) => {
  const request = Message.parse(msg.buffer as ArrayBuffer)
  console.log(request)

  request.type = MessageType.response
  request.recursionAvailable = true

  if (request.questions.length > 0
        && request.questions[0].questionName === 'www.example.com') {
    request.addAddress('www.example.com', 20680, '93.184.216.34')
    const answer = request.encode()
    server.send(new Buffer(answer.buffer as ArrayBuffer), rinfo.port, rinfo.address)
  } else {
    request.returnCode = ReturnCode.nameError
    const answer = request.encode()
    server.send(new Buffer(answer.buffer as ArrayBuffer), rinfo.port, rinfo.address)
  }
})

server.on('listening', () => {
  const address = server.address() as AddressInfo
  console.log(`server listening ${address.address}:${address.port}`)
})

server.bind(53)
