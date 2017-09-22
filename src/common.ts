export type Question = {
    questionName: string;
    questionType: QuestionType;
    questionClass: QuestionClass;
};

export type Answer = {
    answerName: string;
    answerClass: AnswerClass;
    timeToLive: number;
    dataLength: number;
} & ({
    answerType: AnswerType.A;
    address: string;
} | {
        answerType: AnswerType.CNAME;
        CNAME: string;
    });

export const enum MessageType {
    request = 0,
    response = 1,
}

export const enum OperationNode {
    query = 0,
}

export const enum ReturnCode {
    success = 0,
    nameError = 3,
}

export const enum QuestionType {
    A = 0x01,
}

export const enum AnswerType {
    A = 0x01,
    CNAME = 0x05,
}

export const enum QuestionClass {
    IN = 0x0001,
}

export const enum AnswerClass {
    IN = 0x0001,
}

// tslint:disable:no-bitwise

import { BinaryDecoder as BrowserBinaryDecoder, BinaryEncoder as BinaryEncoderType } from "fluent-binary-converter/browser";
import { BinaryDecoder as NodejsBinaryDecoder } from "fluent-binary-converter/nodejs";

export default class MessageBase {
    protected static parseInternally(binaryDecoder: BrowserBinaryDecoder | NodejsBinaryDecoder, message: MessageBase) {
        const flags = binaryDecoder.getUint16(false);
        const questionResourceRecordCount = binaryDecoder.getUint16(false);
        const answerResourceRecordCount = binaryDecoder.getUint16(false);
        const authorityResourceRecordCount = binaryDecoder.getUint16(false);
        const additionalResourceRecordCount = binaryDecoder.getUint16(false);

        message.flags = flags;

        for (let i = 0; i < questionResourceRecordCount; i++) {
            const questionName = getDomainName(binaryDecoder);
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
            const address = getIP(binaryDecoder, dataLength);
            if (answerType === AnswerType.A) {
                message.addAddress(message.questions[0].questionName, timeToLive, address, answerClass);
            }
        }

        for (let i = 0; i < authorityResourceRecordCount; i++) {
            // todo
        }

        for (let i = 0; i < additionalResourceRecordCount; i++) {
            // todo
        }
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

    public addAddress(answerName: string, timeToLive: number, address: string, answerClass = AnswerClass.IN, dataLength = 4) {
        this.answers.push({ answerName, answerType: AnswerType.A, answerClass, timeToLive, address, dataLength });
    }

    public addCNAME(answerName: string, timeToLive: number, CNAME: string, answerClass = AnswerClass.IN, dataLength = 4) {
        this.answers.push({ answerName, answerType: AnswerType.CNAME, answerClass, timeToLive, CNAME, dataLength });
    }

    protected encodeInternally(BinaryEncoder: typeof BinaryEncoderType) {
        const buffers: Uint8Array[] = [];
        buffers.push(BinaryEncoder.fromUint16(false, this.transactionId));
        buffers.push(BinaryEncoder.fromUint16(false, this.flags));
        buffers.push(BinaryEncoder.fromUint16(false, this.questionResourceRecordCount));
        buffers.push(BinaryEncoder.fromUint16(false, this.answerResourceRecordCount));
        buffers.push(BinaryEncoder.fromUint16(false, this.authorityResourceRecordCount));
        buffers.push(BinaryEncoder.fromUint16(false, this.additionalResourceRecordCount));

        for (const question of this.questions) {
            const labels = question.questionName.split(".");
            for (const label of labels) {
                buffers.push(BinaryEncoder.fromUint8(label.length));
                buffers.push(BinaryEncoder.fromString(label));
            }
            buffers.push(BinaryEncoder.fromUint8(0));
            buffers.push(BinaryEncoder.fromUint16(false, question.questionType));
            buffers.push(BinaryEncoder.fromUint16(false, question.questionClass));
        }

        for (const answer of this.answers) {
            buffers.push(BinaryEncoder.fromUint8(0xc0, 0x0c));
            buffers.push(BinaryEncoder.fromUint16(false, answer.answerType));
            buffers.push(BinaryEncoder.fromUint16(false, answer.answerClass));
            buffers.push(BinaryEncoder.fromUint32(false, answer.timeToLive));
            buffers.push(BinaryEncoder.fromUint16(false, answer.dataLength));
            if (answer.answerType === AnswerType.A) {
                const addressParts = answer.address.split(".").map(a => +a);
                buffers.push(BinaryEncoder.fromUint8(...addressParts));
            } else if (answer.answerType === AnswerType.CNAME) {
                const CNAMEParts = answer.CNAME.split(".").map(a => +a);
                buffers.push(BinaryEncoder.fromUint8(...CNAMEParts));
            }
        }

        return BinaryEncoder.concat(...buffers);
    }
}

function getDomainName(binaryDecoder: BrowserBinaryDecoder | NodejsBinaryDecoder) {
    const labels: string[] = [];
    let labelSize = binaryDecoder.getUint8();
    while (labelSize > 0) {
        const label = binaryDecoder.getString(labelSize);
        labels.push(label);
        labelSize = binaryDecoder.getUint8();
    }
    return labels.join(".");
}

function getIP(binaryDecoder: BrowserBinaryDecoder | NodejsBinaryDecoder, dataLength: number) {
    const addressParts: number[] = [];
    for (let j = 0; j < dataLength; j++) {
        const addressPart = binaryDecoder.getUint8();
        addressParts.push(addressPart);
    }
    return addressParts.join(".");
}
