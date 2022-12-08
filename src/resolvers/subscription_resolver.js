const { withFilter } = require("graphql-subscriptions");
const { pubSub } = require("../listeners/db_listeners");
const { print, verifyToken } = require("../utils/utils");

module.exports = {
  test: {
    subscribe: withFilter(
      (...x) => {
        // print(x);
        return pubSub.asyncIterator(["INSERTED_TODO"]);
      },
      (payload, { auth }, context, info, rest) => {
        print(context);
        return !!auth;
      }
    ),
  },
};
