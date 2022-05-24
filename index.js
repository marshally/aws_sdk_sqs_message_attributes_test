require('./tracing');
const AWS = require('aws-sdk');
const sqs = new AWS.SQS({ apiVersion: '2015-03-31' });

(() => {
    const https = require('https');
  
    const originalHttpsRequestFn = https.request;
  
    https.request = (...args) => {
      const outgoingReq = originalHttpsRequestFn(...args);
      if (args[0]?.host === 'sqs.us-east-1.amazonaws.com' && args[0].method === 'POST') {
        const outgoingReqOriginalEndFn = outgoingReq.end;
  
        outgoingReq.end = function (payload, ...rest) {
          if (typeof payload === 'string') {
            console.debug('HTTP BODY DEBUG LOG ------>', payload);
          }
          return outgoingReqOriginalEndFn.call(this, payload, ...rest);
        };
      }
  
      return outgoingReq;
    };
  })();

const receiveMessageConfig = {
    QueueUrl: process.env.QUEUE_URL,
    AttributeNames: ['SentTimestamp'],
    MaxNumberOfMessages: 1,
    MessageAttributeNames: ['All'],
    VisibilityTimeout: 20,
    WaitTimeSeconds: 1,
};

async function sqsConsumer() {
  const resp = await sqs.receiveMessage(receiveMessageConfig).promise();

  const messages = resp.Messages || [];
  console.log(messages)

  let received_message_ids;
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

async function main() {
  await sqsConsumer();
  await sqsConsumer();
  await sqsConsumer();  
}

main();
