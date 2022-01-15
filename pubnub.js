const PubNub = require("pubnub");

const pubnub = new PubNub({
  publishKey: "pub-c-3272fe08-52e8-4278-826d-98a0cc703878",
  subscribeKey: "sub-c-afe58600-7616-11ec-add2-a260b15b99c5",
  uuid: "myUniqueUUID",
});

async function publishSampleMessage() {
  console.log(
    "Since we're publishing on subscribe connectEvent, we're sure we'll receive the following publish."
  );
  const result = await pubnub.publish({
    channel: "hello_world",
    message: {
      title: "greeting",
      description: "hello world!",
    },
  });
  console.log(result);
}

pubnub.addListener({
  status: function (statusEvent) {
    if (statusEvent.category === "PNConnectedCategory") {
      publishSampleMessage();
    }
  },
  message: function (messageEvent) {
    console.log(messageEvent.message.title);
    console.log(messageEvent.message.description);
  },
  presence: function (presenceEvent) {
    // handle presence
  },
});
console.log("Subscribing..");

pubnub.subscribe({
  channels: ["hello_world"],
});
