import { BinaryDecoder, BinaryEncoder } from 'fluent-binary-converter'

/**
 * @public
 */
export interface Question {
  questionName: string;
  questionType: QuestionType;
  questionClass: QuestionClass;
}

/**
 * @public
 */
export type Answer =
  &{
    answerName: string;
    answerClass: AnswerClass;
    timeToLive: number;
  }
  & (
    | {
      answerType: AnswerType.A;
      address: string;
    }
    | {
      answerType: AnswerType.CNAME;
      CNAME: string;
    }
  )

export const enum MessageType {
  request = 0,
  response = 1
}

export const enum OperationNode {
  query = 0
}

export const enum ReturnCode {
  success = 0,
  nameError = 3
}

export const enum QuestionType {
  A = 0x01
}

export const enum AnswerType {
  A = 0x01,
  CNAME = 0x05
}

export const enum QuestionClass {
  IN = 0x0001
}

export const enum AnswerClass {
  IN = 0x0001
}

interface NameHistory {
  name: string;
  index: number;
}

/**
 * @public
 */
export default class Message {
  public type = MessageType.request
  public operationNode = OperationNode.query
  public authoritative = false
  public truncated = false
  public recursionDesired = true
  public recursionAvailable = false
  public reserved = 0
  public returnCode = ReturnCode.success

  public questions: Question[] = []
  public answers: Answer[] = []
  public authorities: unknown[] = []
  public additionals: unknown[] = []

  constructor(public transactionId: number) { }

  public static parse(arrayBuffer: ArrayBuffer) {
    const binaryDecoder = new BinaryDecoder(arrayBuffer)
    const transactionId = binaryDecoder.getUint16(false)
    const message = new Message(transactionId)
    const flags = binaryDecoder.getUint16(false)
    const questionResourceRecordCount = binaryDecoder.getUint16(false)
    const answerResourceRecordCount = binaryDecoder.getUint16(false)
    const authorityResourceRecordCount = binaryDecoder.getUint16(false)
    const additionalResourceRecordCount = binaryDecoder.getUint16(false)

    message.flags = flags

    for (let i = 0; i < questionResourceRecordCount; i++) {
      const questionName = getDomainName(binaryDecoder)
      const questionType = binaryDecoder.getUint16(false)
      const questionClass = binaryDecoder.getUint16(false)
      message.addQuestion(questionName, questionType, questionClass)
    }

    for (let i = 0; i < answerResourceRecordCount; i++) {
      const answerName = getDomainName(binaryDecoder)
      const answerType = binaryDecoder.getUint16(false)
      const answerClass = binaryDecoder.getUint16(false)
      const timeToLive = binaryDecoder.getUint32(false)
      const dataLength = binaryDecoder.getUint16(false)
      if (answerType === AnswerType.A) {
        const address = getIP(binaryDecoder, dataLength)
        message.addAddress(answerName, timeToLive, address, answerClass)
      } else if (answerType === AnswerType.CNAME) {
        const CNAME = getDomainName(binaryDecoder)
        message.addCNAME(answerName, timeToLive, CNAME, answerClass)
      }
    }

    for (let i = 0; i < authorityResourceRecordCount; i++) {
      // todo
    }

    for (let i = 0; i < additionalResourceRecordCount; i++) {
      // todo
    }
    return message
  }

  public encode() {
    const buffers: Uint8Array[] = []
    buffers.push(BinaryEncoder.fromUint16(false, this.transactionId))
    buffers.push(BinaryEncoder.fromUint16(false, this.flags))
    buffers.push(BinaryEncoder.fromUint16(false, this.questionResourceRecordCount))
    buffers.push(BinaryEncoder.fromUint16(false, this.answerResourceRecordCount))
    buffers.push(BinaryEncoder.fromUint16(false, this.authorityResourceRecordCount))
    buffers.push(BinaryEncoder.fromUint16(false, this.additionalResourceRecordCount))

    const nameHistories: NameHistory[] = []

    for (const question of this.questions) {
      setName(buffers, question.questionName, nameHistories)
      buffers.push(BinaryEncoder.fromUint16(false, question.questionType))
      buffers.push(BinaryEncoder.fromUint16(false, question.questionClass))
    }

    for (const answer of this.answers) {
      setName(buffers, answer.answerName, nameHistories)
      buffers.push(BinaryEncoder.fromUint16(false, answer.answerType))
      buffers.push(BinaryEncoder.fromUint16(false, answer.answerClass))
      buffers.push(BinaryEncoder.fromUint32(false, answer.timeToLive))
      if (answer.answerType === AnswerType.A) {
        buffers.push(BinaryEncoder.fromUint16(false, 4))
        const addressParts = answer.address.split('.').map(a => +a)
        buffers.push(BinaryEncoder.fromUint8(...addressParts))
      } else if (answer.answerType === AnswerType.CNAME) {
        const startIndex = buffers.length
        buffers.push(new Uint8Array(2)) // empty Buffer(size = 2)
        setName(buffers, answer.CNAME, nameHistories)
        const dataLength = buffers.filter((b, i) => i > startIndex).reduce((p, c) => p + c.length, 0)
        buffers[startIndex] = BinaryEncoder.fromUint16(false, dataLength) // replace the empty Buffer with the data length
      }
    }

    return BinaryEncoder.concat(...buffers)
  }

  public get flags() {
    return (this.type << 15)
      + (this.operationNode << 11)
      + (this.authoritative ? 1 << 10 : 0)
      + (this.truncated ? 1 << 9 : 0)
      + (this.recursionDesired ? 1 << 8 : 0)
      + (this.recursionAvailable ? 1 << 7 : 0)
      + (this.reserved << 4)
      + this.returnCode
  }
  public set flags(value: number) {
    this.type = value >> 15 & 0b1
    this.operationNode = value >> 11 & 0b1111
    this.authoritative = (value >> 10 & 0b1) === 1
    this.truncated = (value >> 9 & 0b1) === 1
    this.recursionDesired = (value >> 8 & 0b1) === 1
    this.recursionAvailable = (value >> 7 & 0b1) === 1
    this.reserved = value >> 4 & 0b111
    this.returnCode = value & 0b1111
  }
  public get questionResourceRecordCount() {
    return this.questions.length
  }
  public get answerResourceRecordCount() {
    return this.answers.length
  }
  public get authorityResourceRecordCount() {
    return this.authorities.length
  }
  public get additionalResourceRecordCount() {
    return this.additionals.length
  }

  public addQuestion(questionName: string, questionType = QuestionType.A, questionClass = QuestionClass.IN) {
    this.questions.push({ questionName, questionType, questionClass })
  }

  public addAddress(answerName: string, timeToLive: number, address: string, answerClass = AnswerClass.IN) {
    this.answers.push({ answerName, answerType: AnswerType.A, answerClass, timeToLive, address })
  }

  public addCNAME(answerName: string, timeToLive: number, CNAME: string, answerClass = AnswerClass.IN) {
    this.answers.push({ answerName, answerType: AnswerType.CNAME, answerClass, timeToLive, CNAME })
  }
}

function getDomainNameFromPointer(binaryDecoder: BinaryDecoder): string {
  const pointerIndex = binaryDecoder.getUint8()
  const currentIndex = binaryDecoder.index
  binaryDecoder.index = pointerIndex
  const result = getDomainName(binaryDecoder)
  binaryDecoder.index = currentIndex
  return result
}

function getDomainName(binaryDecoder: BinaryDecoder): string {
  let labelSize = binaryDecoder.getUint8()
  if (labelSize === 0xc0) {
    return getDomainNameFromPointer(binaryDecoder)
  }
  const labels: string[] = []
  while (labelSize > 0) {
    if (labelSize === 0xc0) {
      labels.push(getDomainNameFromPointer(binaryDecoder))
      break
    }
    const label = binaryDecoder.getString(labelSize)
    labels.push(label)
    labelSize = binaryDecoder.getUint8()
  }
  return labels.join('.')
}

function getIP(binaryDecoder: BinaryDecoder, dataLength: number) {
  const addressParts: number[] = []
  for (let j = 0; j < dataLength; j++) {
    const addressPart = binaryDecoder.getUint8()
    addressParts.push(addressPart)
  }
  return addressParts.join('.')
}

function find<T>(array: T[], condition: (element: T) => boolean): T | undefined {
  for (const element of array) {
    if (condition(element)) {
      return element
    }
  }
  return undefined
}

function setName(buffers: Uint8Array[], name: string, nameHistories: NameHistory[]) {
  // if the whole domain name is found in the history, use the pointer
  let matchedNameHistory = find(nameHistories, h => h.name === name)
  if (matchedNameHistory) {
    buffers.push(BinaryEncoder.fromUint8(0xc0, matchedNameHistory.index))
    return
  }

  const labelIndexes: number[] = []
  let nextIndex = buffers.reduce((p, c) => p + c.length, 0)
  const labels = name.split('.')
  for (let i = 0; i < labels.length; i++) {
    labelIndexes.push(nextIndex)

    // if the part of domain name is found in the history, use the pointer
    if (i > 0) {
      const partName = labels.slice(i).join('.')
      matchedNameHistory = find(nameHistories, h => h.name === partName)
      if (matchedNameHistory) {
        buffers.push(BinaryEncoder.fromUint8(0xc0, matchedNameHistory.index))
        for (let j = 0; j < i; j++) {
          nameHistories.push({
            name: j === 0 ? name : labels.slice(j).join('.'),
            index: labelIndexes[j]!,
          })
        }
        return
      }
    }

    const label = labels[i]!
    buffers.push(BinaryEncoder.fromUint8(label.length))
    buffers.push(BinaryEncoder.fromString(label))
    nextIndex += 1 + label.length
  }

  buffers.push(BinaryEncoder.fromUint8(0))

  // save all part domain name into history
  for (let j = 0; j < labels.length; j++) {
    nameHistories.push({
      name: j === 0 ? name : labels.slice(j).join('.'),
      index: labelIndexes[j]!,
    })
  }
}
