# aws_sdk_sqs_message_attributes_test

This is an example repository which demonstrates a problem I have when using the [@opentelemetry-instrumentation-aws-sdk](https://github.com/open-telemetry/opentelemetry-js-contrib/blob/8b36fe16abca0a6326d48e5a22fd9302f2936609/plugins/node/opentelemetry-instrumentation-aws-sdk/)


It's not clear to me whether the problem is in my code or in the `opentelemetry-instrumentation-aws-sdk`?

## Problem Statement

When calling `ReceiveMessage` multiple times in the same process, the auto instrumentation libary adds new `MessageAttribute` each time calling `ReceiveMessage`. These attributes do not seem to be cleaned up and build up over time.

Eventually, the request body is so large (>256KB) that AWS rejects the `receiveMessages` call with `413 REQUEST ENTITY TOO LARGE`.

## Suspected problem area

I noticed that `@opentelemetry-instrumentation-aws-sdk` has some protections against overflowing the `MessageAttributes` based on the [`MAX_MESSAGE_ATTRIBUTES`])https://github.com/open-telemetry/opentelemetry-js-contrib/blob/033cc1f7ed09c33e401b9514ed30d1160cf58899/plugins/node/opentelemetry-instrumentation-aws-sdk/src/services/MessageAttributes.ts#L26) constant.

```
if (
    Object.keys(attributes).length + propagation.fields().length <=
    MAX_MESSAGE_ATTRIBUTES
  ) {
    propagation.inject(context.active(), attributes, contextSetter);
  } else {
    diag.warn(
      'aws-sdk instrumentation: cannot set context propagation on SQS/SNS message due to maximum amount of MessageAttributes'
    );
  }
```

https://github.com/open-telemetry/opentelemetry-js-contrib/blob/033cc1f7ed09c33e401b9514ed30d1160cf58899/plugins/node/opentelemetry-instrumentation-aws-sdk/src/services/MessageAttributes.ts#L70-L85

However, this code block only executes on `SendMessage` and `SendMessagesBatch` calls.

## Potential fixes

1. Most likely I am doing something dumb in my code, probably related to not setting a new tracing context for every trip through my `while` loop.
2. Alternately, we might want to patch `@opentelemetry-instrumentation-aws-sdk` so that `MAX_MESSAGE_ATTRIBUTES` protections apply to `ReceiveMessages` also.

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

