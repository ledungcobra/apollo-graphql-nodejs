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
    subscribe: async function* (x, { from }, y) {
      print("X =");
      print(x);
      print("Y = ");
      print(y);
      for (let i = from; i >= 0; i--) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        yield { countdown: i };
      }
    },
  },
};
