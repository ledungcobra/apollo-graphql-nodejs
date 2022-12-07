const { pubSub } = require("../listeners/db_listeners");
const { print } = require("../utils/utils");

module.exports = {
  test: {
    subscribe: () => {
      print("Running");
      return pubSub.asyncIterator(["INSERTED_TODO"]);
    },
  },
};
