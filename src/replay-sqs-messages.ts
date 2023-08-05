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

  let currentMessages: Message[] = [];
  let replayPromises: Promise<any>[] = [];
  let replayedMessageCount = 0;

  process.on("SIGINT", async () => {
    await Promise.all(replayPromises);
    process.exit(0);
  });

  process.on("exit", () => {
    console.log(`\nReplayed ${replayedMessageCount} messages successfully!`);
  });

  const receiveMessageCommand = new ReceiveMessageCommand({
    QueueUrl: from,
    MaxNumberOfMessages: 10,
    AttributeNames: ["All"],
    MessageAttributeNames: ["All"],
  });

  do {
    const data = await client.send(receiveMessageCommand);
    currentMessages = data.Messages ?? [];

    replayPromises = currentMessages.map(async (message) => {
      console.log(
        `Sending message -> [${message.ReceiptHandle}]`,
        message.Body
      );

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

        await client.send(deleteMessageCommand);
      }

      console.log(`[${message.ReceiptHandle}] -> Message sent`);
    });

    await Promise.all(replayPromises);

    replayedMessageCount += replayPromises.length;
  } while (currentMessages.length > 0);
};
