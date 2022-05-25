# aws_sdk_sqs_message_attributes_test

This is an example repository which demonstrates a problem I have when using the [https://github.com/open-telemetry/opentelemetry-js-contrib/blob/8b36fe16abca0a6326d48e5a22fd9302f2936609/plugins/node/opentelemetry-instrumentation-aws-sdk/](opentelemetry-instrumentation-aws-sdk).

It's not clear to me whether the problem is in my code or in the `opentelemetry-instrumentation-aws-sdk`?

## Problem Statement

When calling `ReceiveMessage` multiple times in the same process, the auto instrumentation libary adds new `MessageAttribute` each time calling `ReceiveMessage`. These attributes do not seem to be cleaned up and build up over time.

Eventually, the request body is so large (>256KB) that AWS rejects the `receiveMessages` call with `413 REQUEST ENTITY TOO LARGE`.


## Supporting CLI output

(this output has been slightly edited for clarity)

```
$ node index.js
writing tracing data to NoopSpanProcessor

ReceiveMessage
HTTP BODY DEBUG LOG ------> Action=ReceiveMessage&AttributeName.1=SentTimestamp&MaxNumberOfMessages=1&MessageAttributeName.1=All&QueueUrl=https%3A%2F%2Fsqs.us-east-1.amazonaws.com%2F623766430081%2FMCY-API-SQS&Version=2012-11-05&VisibilityTimeout=20&WaitTimeSeconds=1
pick 73a4048 yarn add @opentelemetry/auto-instrumentations-node
Tracing initialized

ReceiveMessage
HTTP BODY DEBUG LOG ------> Action=ReceiveMessage&AttributeName.1=SentTimestamp&MaxNumberOfMessages=1&MessageAttributeName.1=All&MessageAttributeName.2=traceparent&MessageAttributeName.3=tracestate&MessageAttributeName.4=baggage&QueueUrl=https%3A%2F%2Fsqs.us-east-1.amazonaws.com%2F623766430081%2FMCY-API-SQS&Version=2012-11-05&VisibilityTimeout=20&WaitTimeSeconds=1

ReceiveMessage
HTTP BODY DEBUG LOG ------> Action=ReceiveMessage&AttributeName.1=SentTimestamp&MaxNumberOfMessages=1&MessageAttributeName.1=All&MessageAttributeName.2=traceparent&MessageAttributeName.3=tracestate&MessageAttributeName.4=baggage&MessageAttributeName.5=traceparent&MessageAttributeName.6=tracestate&MessageAttributeName.7=baggage&QueueUrl=https%3A%2F%2Fsqs.us-east-1.amazonaws.com%2F623766430081%2FMCY-API-SQS&Version=2012-11-05&VisibilityTimeout=20&WaitTimeSeconds=1
```

