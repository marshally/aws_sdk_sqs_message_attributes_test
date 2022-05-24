const AWS = require('aws-sdk');
const sqs = new AWS.SQS({ apiVersion: '2015-03-31' });


const receiveMessageConfig = {
    QueueUrl: process.env.QUEUE_URL,
    AttributeNames: ['SentTimestamp'],
    MaxNumberOfMessages: 1,
    MessageAttributeNames: ['All'],
    VisibilityTimeout: 20,
    WaitTimeSeconds: 10,
};

async function sqsConsumer() {
  while (true) {
    const resp = await sqs.receiveMessage(receiveMessageConfig).promise();

    const messages = resp.Messages || [];
    console.log(messages)

    if (messages.length) {
      received_message_ids = messages.map(({ ReceiptHandle }, k) => ({
        Id: k.toString(),
        ReceiptHandle,
      }));

      // do stuff

      const deletionPromise = sqs
            .deleteMessageBatch({
              QueueUrl: receiveMessageConfig.QueueUrl,
              Entries: received_message_ids,
            })
            .promise();

      await deletionPromise;
    }
  }
}

sqsConsumer();
