import { BinaryDecoder, BinaryEncoder } from "fluent-binary-converter/nodejs";

import { Question, Answer, MessageType, OperationNode, ReturnCode, QuestionType, AnswerType, QuestionClass, AnswerClass } from "./common";
export { Question, Answer, MessageType, OperationNode, ReturnCode, QuestionType, AnswerType, QuestionClass, AnswerClass };

// tslint:disable:no-bitwise

/**
 * @public
 */
export default class Message {
    public static parse(arrayBuffer: ArrayBuffer) {
        const binaryDecoder = new BinaryDecoder(arrayBuffer);
        const transactionId = binaryDecoder.getUint16(false);
        const flags = binaryDecoder.getUint16(false);
        const questionResourceRecordCount = binaryDecoder.getUint16(false);
        const answerResourceRecordCount = binaryDecoder.getUint16(false);
        const authorityResourceRecordCount = binaryDecoder.getUint16(false);
        const additionalResourceRecordCount = binaryDecoder.getUint16(false);

        const message = new Message(transactionId);
        message.flags = flags;

        for (let i = 0; i < questionResourceRecordCount; i++) {
            const labels: string[] = [];
            let labelSize = binaryDecoder.getUint8();
            while (labelSize > 0) {
                const label = binaryDecoder.getString(labelSize);
                labels.push(label);
                labelSize = binaryDecoder.getUint8();
            }
            const questionName = labels.join(".");
            const questionType = binaryDecoder.getUint16(false);
            const questionClass = binaryDecoder.getUint16(false);
            message.addQuestion(questionName, questionType, questionClass);
        }

        for (let i = 0; i < answerResourceRecordCount; i++) {
            binaryDecoder.getUint16(false);
            const answerType = binaryDecoder.getUint16(false);
            const answerClass = binaryDecoder.getUint16(false);
            const timeToLive = binaryDecoder.getUint32(false);
            const dataLength = binaryDecoder.getUint16(false);
            const addressParts: number[] = [];
            for (let j = 0; j < dataLength; j++) {
                const addressPart = binaryDecoder.getUint8();
                addressParts.push(addressPart);
            }
            const address = addressParts.join(".");
            message.addAnswer(message.questions[0].questionName, timeToLive, address, answerType, answerClass);
        }

        for (let i = 0; i < authorityResourceRecordCount; i++) {
            // todo
        }

        for (let i = 0; i < additionalResourceRecordCount; i++) {
            // todo
        }

        return message;
    }

    public type = MessageType.request;
    public operationNode = OperationNode.query;
    public authoritative = false;
    public truncated = false;
    public recursionDesired = true;
    public recursionAvailable = false;
    public reserved = 0;
    public returnCode = ReturnCode.success;

    public questions: Question[] = [];
    public answers: Answer[] = [];
    public authorities: any[] = [];
    public additionals: any[] = [];

    constructor(public transactionId: number) { }

    public get flags() {
        return (this.type << 15)
            + (this.operationNode << 11)
            + (this.authoritative ? 1 << 10 : 0)
            + (this.truncated ? 1 << 9 : 0)
            + (this.recursionDesired ? 1 << 8 : 0)
            + (this.recursionAvailable ? 1 << 7 : 0)
            + (this.reserved << 4)
            + this.returnCode;
    }
    public set flags(value: number) {
        this.type = value >> 15 & 0b1;
        this.operationNode = value >> 11 & 0b1111;
        this.authoritative = (value >> 10 & 0b1) === 1;
        this.truncated = (value >> 9 & 0b1) === 1;
        this.recursionDesired = (value >> 8 & 0b1) === 1;
        this.recursionAvailable = (value >> 7 & 0b1) === 1;
        this.reserved = value >> 4 & 0b111;
        this.returnCode = value & 0b1111;
    }
    public get questionResourceRecordCount() {
        return this.questions.length;
    }
    public get answerResourceRecordCount() {
        return this.answers.length;
    }
    public get authorityResourceRecordCount() {
        return this.authorities.length;
    }
    public get additionalResourceRecordCount() {
        return this.additionals.length;
    }

    public addQuestion(questionName: string, questionType = QuestionType.A, questionClass = QuestionClass.IN) {
        this.questions.push({ questionName, questionType, questionClass });
    }

    public addAnswer(answerName: string, timeToLive: number, address: string, answerType = AnswerType.A, answerClass = AnswerClass.IN, dataLength = 4) {
        this.answers.push({ answerName, answerType, answerClass, timeToLive, address, dataLength });
    }

    public encode() {
        const transactionId = BinaryEncoder.fromUint16(false, this.transactionId);
        const flags = BinaryEncoder.fromUint16(false, this.flags);
        const questionResourceRecordCount = BinaryEncoder.fromUint16(false, this.questionResourceRecordCount);
        const answerResourceRecordCount = BinaryEncoder.fromUint16(false, this.answerResourceRecordCount);
        const authorityResourceRecordCount = BinaryEncoder.fromUint16(false, this.authorityResourceRecordCount);
        const additionalResourceRecordCount = BinaryEncoder.fromUint16(false, this.additionalResourceRecordCount);

        let resultLength = transactionId.length + flags.length
            + questionResourceRecordCount.length
            + answerResourceRecordCount.length
            + authorityResourceRecordCount.length
            + additionalResourceRecordCount.length;
        const buffers: Uint8Array[] = [];
        for (const question of this.questions) {
            const labels = question.questionName.split(".");
            for (const label of labels) {
                const labelSizeBuffer = BinaryEncoder.fromUint8(label.length);
                resultLength += labelSizeBuffer.length;
                buffers.push(labelSizeBuffer);

                const labelBuffer = BinaryEncoder.fromString(label);
                resultLength += labelBuffer.length;
                buffers.push(labelBuffer);
            }

            const endBuffer = BinaryEncoder.fromUint8(0);
            resultLength += endBuffer.length;
            buffers.push(endBuffer);

            const questionType = BinaryEncoder.fromUint16(false, question.questionType);
            resultLength += questionType.length;
            buffers.push(questionType);

            const questionClass = BinaryEncoder.fromUint16(false, question.questionClass);
            resultLength += questionClass.length;
            buffers.push(questionClass);
        }

        for (const answer of this.answers) {
            const answerName = BinaryEncoder.fromUint8(0xc0, 0x0c);
            resultLength += answerName.length;
            buffers.push(answerName);

            const answerType = BinaryEncoder.fromUint16(false, answer.answerType);
            resultLength += answerType.length;
            buffers.push(answerType);

            const answerClass = BinaryEncoder.fromUint16(false, answer.answerClass);
            resultLength += answerClass.length;
            buffers.push(answerClass);

            const timeToLive = BinaryEncoder.fromUint32(false, answer.timeToLive);
            resultLength += timeToLive.length;
            buffers.push(timeToLive);

            const dataLength = BinaryEncoder.fromUint16(false, answer.dataLength);
            resultLength += dataLength.length;
            buffers.push(dataLength);

            const addressParts = answer.address.split(".").map(a => +a);
            const address = BinaryEncoder.fromUint8(...addressParts);
            resultLength += address.length;
            buffers.push(address);
        }

        const result = new Uint8Array(resultLength);
        new BinaryEncoder(result).setBinary(transactionId,
            flags,
            questionResourceRecordCount,
            answerResourceRecordCount,
            authorityResourceRecordCount,
            additionalResourceRecordCount, ...buffers);
        return result;
    }
}
