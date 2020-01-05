var amqp = require('amqplib/callback_api');

const LOCAL_URL = 'amqp://localhost';
const QUEUE_NAME = 'rpc_queue';

// Connect to an AMQP server
amqp.connect(LOCAL_URL, function (error0, connection) {

	if (error0) {
		throw error0;
	}

	connection.createChannel(function (error1, channel) {
		if (error1) {
			throw error1;
		}

		// Assert a queue into existence.
		channel.assertQueue(QUEUE_NAME, {
			durable: false
		});
		// Set the prefetch count for this channel.
		// The count given is the maximum number of messages sent over the channel that can be awaiting acknowledgement;
		channel.prefetch(1);
		console.log(' [x] Awaiting RPC requests');

		// We use Channel.consume to consume messages from the queue
		// Set up a consumer with a callback to be invoked with each message.
		channel.consume(QUEUE_NAME, function reply(msg) {
			var n = parseInt(msg.content.toString());

			console.log(" [.] fib(%d)", n);

			var result = fibonacci(n);

			// Then we enter the callback function where do the work and send the response back.
			channel.sendToQueue(
				msg.properties.replyTo,
				Buffer.from(result.toString()),
				{
					correlationId: msg.properties.correlationId
				}
			);

			channel.ack(msg);
		});

	});

});



function fibonacci(n) {
	if (n == 0 || n == 1)
		return n;
	else
		return fibonacci(n - 1) + fibonacci(n - 2);
}