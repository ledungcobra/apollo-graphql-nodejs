const { GraphQLError } = require("graphql");
const { ASSIGN_MEMBER_TODO, ASSIGN_PRJECT_TODO, DELETE_TODO, DONE_TODO, INSERT_TODO } = require("../pubsub/actions");
const pubSub = require("../pubsub/index");
const { requireMemberOfProject, requireProjectOwner, sql } = require("./base_service");

const getTodosByUserId = (id) => {
  return sql`SELECT * FROM todos WHERE created_user_id=${id}`;
};

const getTodoById = async (id, userId) => {
  const result = await sql`SELECT t.* FROM todos t 
            WHERE t.id=${id} AND 
                  ( t.created_user_id=${userId} OR 
                    t.assignee=${userId} OR 
                    EXISTS (
                            SELECT 1 
                            FROM users_projects up 
                            WHERE up.project_id=t.project_id AND 
                                  up.user_id=${userId}
                    )
                  )`;
  if (result.length === 0) {
    return null;
  }
  return result[0];
};

const insertTodo = async (todo) => {
  const [result] = await sql`INSERT INTO todos(title, created_user_id, project_id, assignee) 
                          VALUES(${todo.title}, ${todo.created_user_id ?? null},${todo.projectId ?? null},${
    todo.created_user_id ?? null
  }) RETURNING *`;
  pubSub.publish(INSERT_TODO, {
    todoNotification: {
      action: INSERT_TODO,
      payload: result,
    },
  });
  return result;
};

const deleteTodo = async (id, requestUserId) => {
  const todo = (await sql`SELECT * FROM todos t WHERE t.id=${id}`)[0];
  const result = await sql`DELETE FROM todos t
                           WHERE t.id=${id} AND (
                                  t.created_user_id=${requestUserId} OR
                                  EXISTS ( SELECT 1 
                                            FROM projects p 
                                            WHERE p.id=t.project_id AND p.manager_id=${requestUserId}
                                          )
                                  )`;
  pubSub.publish(DELETE_TODO, {
    todoNotification: {
      action: DELETE_TODO,
      payload: todo,
    },
  });
  return todo;
};

const assignTodoProject = async (todoId, projectId, requestUserId) => {
  await requireProjectOwner(requestUserId, projectId);
  const affectedRow = await sql`UPDATE todos  SET project_id=${projectId}
            WHERE id=${todoId} AND 
                  created_user_id=${requestUserId}
            RETURNING *
            `;
  if (affectedRow.length) {
    throw new GraphQLError("An error occur when assign todo to a project");
  }
  const result = await sql` SELECT * FROM todos t 
                            WHERE t.id=${todoId}`;
  pubSub.publish(ASSIGN_PRJECT_TODO, {
    todoNotification: {
      action: ASSIGN_PRJECT_TODO,
      payload: result[0],
    },
  });
  return result[0];
};

const assignTodoToMember = async (todoId, userId, requestUserId) => {
  const [todo] = await sql`SELECT t.* FROM todos t JOIN projects p on t.project_id=p.id 
                  WHERE t.id=${todoId} AND p.manager_id=${requestUserId}`;
  if (!todo) {
    throw new GraphQLError("Error when assign TODO to member");
  }

  if (userId) {
    await requireMemberOfProject(userId, todo.project_id);
  }
  const [todo2] = await sql`UPDATE todos SET assignee=${userId ?? null} WHERE id=${todo.id} RETURNING *`;
  if (!todo2) {
    throw new GraphQLError("Todo 2 not found");
  }
  if (userId) {
    pubSub.publish(ASSIGN_MEMBER_TODO, {
      todoNotification: {
        action: ASSIGN_MEMBER_TODO,
        payload: todo2,
      },
    });
  }
  return todo2;
};

const markDone = async (todoId, value, requestUserId) => {
  const [todo] = await sql`UPDATE todos SET is_completed=${value} 
                          WHERE id=${todoId} AND assignee=${requestUserId}
                          RETURNING *`;
  if (!todo) {
    throw new GraphQLError("Could not mark done");
  }
  pubSub.publish(DONE_TODO, {
    todoNotification: {
      action: DONE_TODO,
      payload: todo,
    },
  });
  return todo;
};
module.exports = { getTodosByUserId, getTodoById, insertTodo, deleteTodo, assignTodoProject, assignTodoToMember, markDone };
