import * as dgram from 'dgram'
import Message, { MessageType } from '../dist/nodejs/nodejs'

const client = dgram.createSocket('udp4')

client.on('message', (msg, rinfo) => {
  console.log(rinfo)
  const response = Message.parse(msg.buffer as ArrayBuffer)
  console.log(response)
})

client.on('listening', () => {
  const address = client.address()
  console.log(`client listening ${address.address}:${address.port}`)
})

const request = new Message(43825)
request.addQuestion('www.example.com')
const encodedRequest = request.encode()

client.send(new Buffer(encodedRequest.buffer as ArrayBuffer), 53, '114.114.114.114')
