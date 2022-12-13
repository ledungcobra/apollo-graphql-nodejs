const { GraphQLError } = require("graphql");
const postgres = require("postgres");
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;

const URL = `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?options=project%3D${ENDPOINT_ID}`;

const sql = postgres(URL, { ssl: "require" });

const requireProjectOwner = async (userId, projectId) => {
  const result = await sql`SELECT 1 FROM projects p WHERE p.manager_id=${userId} AND p.id=${projectId}`;
  if (result.length === 0) {
    throw new GraphQLError("You are not the owner of this project", {});
  }
};

const requireOwnerTodo = async (userId, todoId) => {
  const result = await sql`SELECT 1 FROM todos t WHERE t.created_user_id=${userId} AND t.id=${todoId}`;
  if (result.length === 0) {
    throw new GraphQLError("You are not the owner of this todo item");
  }
};

const requireMemberOfProject = async (userId, projectId) => {
  const result = await sql`SELECT 1 FROM users_projects up WHERE up.user_id=${userId} AND up.project_id=${projectId}`;
  if (result.length === 0) {
    throw new GraphQLError(`You are not the member of this project userId=${userId} projectId=${projectId}`);
  }
};

module.exports = { sql, requireProjectOwner, requireOwnerTodo, requireMemberOfProject };
