import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";

type Options = { region?: string; isFifo: boolean; shouldDelete: boolean };

export const replaySqsMessages = async (
  from: string,
  to: string,
  { region, isFifo = false, shouldDelete = false }: Options
) => {
  const client = new SQSClient({ region });

  let messages: Message[] = [];

  const receiveMessageCommand = new ReceiveMessageCommand({
    QueueUrl: from,
    MaxNumberOfMessages: 10,
    AttributeNames: ["All"],
    MessageAttributeNames: ["All"],
  });

  let messageCount = 0;

  do {
    const data = await client.send(receiveMessageCommand);
    messages = data.Messages ?? [];

    const promises = data.Messages?.map(async (message) => {
      console.log("Sending message: ", message.Body);

      const sendMessageCommand = new SendMessageCommand({
        QueueUrl: to,
        MessageBody: message.Body,
        MessageAttributes: message.MessageAttributes,
      });

      if (isFifo) {
        sendMessageCommand.input.MessageGroupId =
          message.Attributes?.MessageGroupId;
        sendMessageCommand.input.MessageDeduplicationId =
          message.Attributes?.MessageDeduplicationId;
      }

      await client.send(sendMessageCommand);

      if (shouldDelete) {
        const deleteMessageCommand = new DeleteMessageCommand({
          QueueUrl: from,
          ReceiptHandle: message.ReceiptHandle,
        });

        const deleteResult = await client.send(deleteMessageCommand);
      }

      messageCount++;
    });

    if (promises) await Promise.all(promises);
  } while (messages.length > 0);

  console.log(`Replayed ${messageCount} messages successfully!`);
};
