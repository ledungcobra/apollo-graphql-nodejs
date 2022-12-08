const { PubSub } = require("graphql-subscriptions");
const { sql } = require("../service/base_service");
const { print } = require("../utils/utils");

const pubSub = new PubSub();

function listenToDbEvent() {
  // sql
  //   .listen(
  //     "insert:todos",
  //     (row) => {
  //       pubSub.publish("INSERTED_TODO", "1");
  //       print("Insert ");
  //       print(row);
  //     },
  //     () => {
  //       print("Reconnect");
  //     }
  //   )
  //   .then("Listening to todo table");
}

module.exports = {
  pubSub,
  listenToDbEvent,
};
