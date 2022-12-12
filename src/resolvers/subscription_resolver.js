const { withFilter } = require("graphql-subscriptions");
const pubSub = require("../pubsub/index");
const { print, verifyToken } = require("../utils/utils");
const actions = require("../pubsub/actions");

const filterTodoOnAction = (action, todo, subUser) => {
  print("Filter " + action);
  switch (action) {
    case actions.INSERT_TODO: {
      return todo.created_user_id === subUser.id || todo.project_id in subUser.projectIds;
    }
    case actions.DELETE_TODO: {
      return todo.created_user_id === subUser.id || todo.project_id in subUser.projectIds;
    }
    case actions.EDIT_TODO: {
      return todo.created_user_id === subUser.id || todo.project_id in subUser.projectIds;
    }
    case actions.ASSIGN_MEMBER_TODO: {
      return todo.project_id in subUser.projectIds;
    }
    case actions.ASSIGN_PRJECT_TODO: {
      break;
    }
    case actions.DONE_TODO: {
      return todo.project_id in subUser.projectIds;
    }
  }
  return false;
};
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
    subscribe: withFilter(
      async function* (x, { from }, user) {
        for (let i = from; i >= 0; i--) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          yield { countdown: i };
        }
      },
      (payload, args, user, info) => {
        return true;
      }
    ),
  },

  todoNotification: {
    subscribe: withFilter(
      () => {
        const acs = Object.keys(actions).map((k) => actions[k]);
        return pubSub.asyncIterator(acs);
      },
      (payload, args, user, info) => {
        return filterTodoOnAction(payload.todoNotification.action, payload.todoNotification.payload, user);
      }
    ),
  },
};
