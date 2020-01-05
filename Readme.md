# AMQP Remote procedure call (RPC)

We learned how to [use Work Queues](https://github.com/dragon13v77/amqp-work-queues) to distribute time-consuming tasks among multiple workers.
But what if we need to run a function on a remote computer and wait for the result?
This pattern is commonly known as <b>Remote Procedure Call</b> or RPC.

We're going to use RabbitMQ to build an RPC system: a client and a scalable RPC server.

### Callback queue
In general doing RPC over RabbitMQ is easy. A client sends a request message and a server replies with a response message.
In order to receive a response we need to send a 'callback' queue address with the request. We can use the default exchange.

>
channel.assertQueue('', {
  exclusive: true
});
>
channel.sendToQueue('rpc_queue', Buffer.from('10'), {
   replyTo: queue_name
});
>
... then code to read a response message from the callback queue ...


### Correlation Id

In the method presented above we suggest creating a callback queue for every RPC request.
That's pretty inefficient, but fortunately there is a better way - let's create a single callback queue per client.

That raises a new issue, having received a response in that queue it's not clear to which request the response belongs.
That's when the correlation_id property is used. We're going to set it to a unique value for every request.
Later, when we receive a message in the callback queue we'll look at this property, and based on that we'll be able to match a response with a request.
If we see an unknown correlation_id value, we may safely discard the message - it doesn't belong to our requests.

### Summary

![Alt text](./assets/schema3.jpg)

Our RPC will work like this:

- When the Client starts up, it creates an anonymous exclusive callback queue.
- For an RPC request, the Client sends a message with two properties:
	- `reply_to`, which is set to the callback queue and
	- `correlation_id`, which is set to a unique value for every request.
- The request is sent to an rpc_queue queue.
- The RPC worker (aka: server) is waiting for requests on that queue.
When a request appears, it does the job and sends a message with the result back to the Client, using the queue from the reply_to field.
- The client waits for data on the callback queue. When a message appears, it checks the correlation_id property.
If it matches the value from the request it returns the response to the application.

---

To test run one or more instances of rpc_server
`node rpc_server`

Then start client and request some processing
`node rpc_client 35`

Detail tutorial can be found here https://www.rabbitmq.com/tutorials/tutorial-six-javascript.html