import { BinaryDecoder, BinaryEncoder } from "fluent-binary-converter/nodejs";

import MessageBase, { Question, Answer, MessageType, OperationNode, ReturnCode, QuestionType, AnswerType, QuestionClass, AnswerClass } from "./common";
export { Question, Answer, MessageType, OperationNode, ReturnCode, QuestionType, AnswerType, QuestionClass, AnswerClass };

/**
 * @public
 */
export default class Message extends MessageBase {
    public static parse(arrayBuffer: ArrayBuffer) {
        const binaryDecoder = new BinaryDecoder(arrayBuffer);
        const transactionId = binaryDecoder.getUint16(false);
        const message = new Message(transactionId);
        this.parseInternally(binaryDecoder, message);
        return message;
    }

    public encode() {
        return this.encodeInternally(BinaryEncoder);
    }
}
