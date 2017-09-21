export type Question = {
    questionName: string;
    questionType: QuestionType;
    questionClass: QuestionClass;
};

export type Answer = {
    answerName: string;
    answerType: AnswerType;
    answerClass: AnswerClass;
    timeToLive: number;
    dataLength: number;
    address: string;
};

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
}

export const enum QuestionClass {
    IN = 0x0001,
}

export const enum AnswerClass {
    IN = 0x0001,
}
