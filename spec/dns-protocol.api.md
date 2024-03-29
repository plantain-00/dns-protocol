## API Report File for "dns-protocol"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

// @public (undocumented)
export type Answer = {
    answerName: string;
    answerClass: AnswerClass;
    timeToLive: number;
} & ({
    answerType: AnswerType.A;
    address: string;
} | {
    answerType: AnswerType.CNAME;
    CNAME: string;
});

// @public (undocumented)
export const enum AnswerClass {
    // (undocumented)
    IN = 1
}

// @public (undocumented)
export const enum AnswerType {
    // (undocumented)
    A = 1,
    // (undocumented)
    CNAME = 5
}

// @public (undocumented)
class Message {
    constructor(transactionId: number);
    // (undocumented)
    addAddress(answerName: string, timeToLive: number, address: string, answerClass?: AnswerClass): void;
    // (undocumented)
    addCNAME(answerName: string, timeToLive: number, CNAME: string, answerClass?: AnswerClass): void;
    // (undocumented)
    get additionalResourceRecordCount(): number;
    // (undocumented)
    additionals: unknown[];
    // (undocumented)
    addQuestion(questionName: string, questionType?: QuestionType, questionClass?: QuestionClass): void;
    // (undocumented)
    get answerResourceRecordCount(): number;
    // (undocumented)
    answers: Answer[];
    // (undocumented)
    authoritative: boolean;
    // (undocumented)
    authorities: unknown[];
    // (undocumented)
    get authorityResourceRecordCount(): number;
    // (undocumented)
    encode(): Uint8Array;
    // (undocumented)
    get flags(): number;
    set flags(value: number);
    // (undocumented)
    operationNode: OperationNode;
    // (undocumented)
    static parse(arrayBuffer: ArrayBuffer): Message;
    // (undocumented)
    get questionResourceRecordCount(): number;
    // (undocumented)
    questions: Question[];
    // (undocumented)
    recursionAvailable: boolean;
    // (undocumented)
    recursionDesired: boolean;
    // (undocumented)
    reserved: number;
    // (undocumented)
    returnCode: ReturnCode;
    // (undocumented)
    transactionId: number;
    // (undocumented)
    truncated: boolean;
    // (undocumented)
    type: MessageType;
}
export default Message;

// @public (undocumented)
export const enum MessageType {
    // (undocumented)
    request = 0,
    // (undocumented)
    response = 1
}

// @public (undocumented)
export const enum OperationNode {
    // (undocumented)
    query = 0
}

// @public (undocumented)
export interface Question {
    // (undocumented)
    questionClass: QuestionClass;
    // (undocumented)
    questionName: string;
    // (undocumented)
    questionType: QuestionType;
}

// @public (undocumented)
export const enum QuestionClass {
    // (undocumented)
    IN = 1
}

// @public (undocumented)
export const enum QuestionType {
    // (undocumented)
    A = 1
}

// @public (undocumented)
export const enum ReturnCode {
    // (undocumented)
    nameError = 3,
    // (undocumented)
    success = 0
}

// (No @packageDocumentation comment for this package)

```
