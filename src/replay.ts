import meow from "meow";
import { replaySqsMessages } from "./replay-sqs-messages.js";

const cli = meow(
  `
  Usage
    $ ./replay queue-from queue-to [options]

  Options
    --region, -r  AWS region
    --fifo, -f    Whether the queues are FIFO queues (default: false)
    --delete, -d  Whether to delete the messages from the source queue (default: true)
`,
  {
    importMeta: import.meta,

    flags: {
      region: {
        type: "string",
        shortFlag: "r",
      },
      fifo: {
        type: "boolean",
        shortFlag: "f",
        default: false,
      },
      delete: {
        type: "boolean",
        shortFlag: "d",
        default: true,
      },
    },
  }
);

const queueFrom = cli.input.at(0);
if (!queueFrom) throw new Error("Missing queue <from> argument.");

const queueTo = cli.input.at(1);
if (!queueTo) throw new Error("Missing queue <to> argument.");

const region = cli.flags.region;
const isFifo = cli.flags.fifo;
const shouldDelete = cli.flags.delete;

replaySqsMessages(queueFrom, queueTo, { region, isFifo, shouldDelete });
