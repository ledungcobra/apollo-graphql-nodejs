const { withFilter } = require("graphql-subscriptions");
const { pubSub } = require("../listeners/db_listeners");
const { print, verifyToken } = require("../utils/utils");

module.exports = {
  test: {
    subscribe: withFilter(
      (...x) => {
        print("Subscribe");
        return pubSub.asyncIterator(["INSERTED_TODO"]);
      },
      (payload, { auth }, context, info, rest) => {
        return true;
      }
    ),
  },
  countdown: {
    subscribe: async function* (_, { from }, user) {
      print(user);
      for (let i = from; i >= 0; i--) {
        print("Count down " + i);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        yield { countdown: i };
      }
    },
  },
};
