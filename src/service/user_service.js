const { print, sql } = require("./base_service");
const bcrypt = require("bcrypt");

const findViewUser = async (userId) => {
  if (!userId) {
    return null;
  }
  const res = await sql`SELECT u.id, u.name, u.created_at, u.last_seen 
                        FROM users u 
                        WHERE id=${userId}`;
  return res[0];
};

const findUser = async (userId) => {
  const res = await sql`SELECT u.* from users u where id=${userId}`;
  if (res.length === 0) {
    return null;
  }
  return res[0];
};

const findProjects = (userId) => {
  return sql`SELECT p.* from projects p JOIN users_projects up on p.id=up.project_id 
              WHERE up.user_id=${userId}
              `;
};

const findTodosByUserId = (userId) => {
  return sql` SELECT t.* 
              FROM todos t 
              WHERE t.created_user_id=${userId} OR 
                    t.assignee=${userId}
          `;
};

const findAssignedTodos = (userId) => {
  return sql`SELECT t.* FROM todos t WHERE t.assignee=${userId} `;
};

const updateUserLastSeen = (userId) => {
  return sql`UPDATE users set last_seen=now()`;
};

const register = async (id, name, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await sql`INSERT INTO users(id, name, password, last_seen)
              VALUES(${id},${name},${hashedPassword}, now()) RETURNING *`;
  if (result.length === 0) {
    return {
      success: false,
      user: null,
    };
  }
  return { success: true, user: result[0] };
};

module.exports = { findViewUser, findProjects, findTodosByUserId, findAssignedTodos, findUser, updateUserLastSeen, register };
