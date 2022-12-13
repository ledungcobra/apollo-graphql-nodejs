const { withFilter } = require("graphql-subscriptions");
const actions = require("../pubsub/actions");
const pubSub = require("../pubsub/index");
const { print } = require("../utils/utils");

const canRunOnAction = (action, todo, subUser) => {
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
  todoNotification: {
    subscribe: withFilter(
      () => {
        const acs = Object.keys(actions).map((k) => actions[k]);
        return pubSub.asyncIterator(acs);
      },
      (payload, args, user, info) => {
        return canRunOnAction(payload.todoNotification.action, payload.todoNotification.payload, user);
      }
    ),
  },
};
