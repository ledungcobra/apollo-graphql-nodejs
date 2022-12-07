const { GraphQLError } = require("graphql");
const { print } = require("../utils/utils");
const { sql, requireMemberOfProject, requireProjectOwner } = require("./base_service");

const findMembers = async (projectId, requestUserId) => {
  await requireMemberOfProject(requestUserId, projectId);
  return sql`     SELECT u.id, u.name, u.last_seen, u.created_at
                  FROM users u join users_projects up ON u.id=up.user_id 
                        JOIN projects p ON p.id=up.project_id
                  WHERE up.project_id=${projectId}
                  `;
};

const findProjectById = async (projectId, reqUserId) => {
  await requireMemberOfProject(reqUserId, projectId);
  const result = await sql`SELECT p.* 
                          FROM projects p
                          WHERE p.id=${projectId}`;
  if (result.length == 0) {
    return null;
  }
  return result[0];
};

const createProject = (name, userId) => {
  if (!userId) {
    throw new GraphQLError("Not found user id");
  }
  return sql.begin(async (sql) => {
    const [project] = await sql`INSERT INTO projects(name, manager_id) 
                                VALUES(${name}, ${userId})
                                RETURNING *
                                `;
    if (!project) {
      throw new GraphQLError("Could not insert project");
    }
    const [userProject] = await sql`INSERT INTO users_projects(project_id, user_id) 
                                  VALUES(${project.id},${userId}) 
                                  RETURNING *`;
    if (!userProject) {
      throw new GraphQLError("Could not insert user to list");
    }
    return project;
  });
};

const addMember = async (userId, projectId, reqUserId) => {
  await requireProjectOwner(reqUserId, projectId);
  const [projectIdObject] = await sql`INSERT INTO users_projects(user_id, project_id)
                        VALUES(${userId}, ${projectId}) 
                        RETURNING *`;
  const [project] = await sql`SELECT * FROM projects p WHERE p.id=${projectIdObject.project_id}`;
  return project;
};

const findTodosByProjectId = async (projectId) => {
  return sql`SELECT * FROM todos WHERE project_id=${projectId}`;
};

module.exports = {
  findMembers,
  findProjectById,
  createProject,
  addMember,
  findTodosByProjectId,
};
