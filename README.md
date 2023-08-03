# SQS Replayer

This is a small TS script to replay SQS messages from one queue to another. It is basically useful to replay messages which fell into a dead letter queue.

## Usage

Install dependencies using `npm i` and then run the replay script :
```sh
./replay <from> <to> ...args
```

## Options

- `--region` - The region in which the queues exists.
- `--is-fifo` - Is the queue a FIFO queue.
- `--should-delete` - Should messages be deleted from the original queue. (enabled by default)
