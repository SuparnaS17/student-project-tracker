
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';

mkdirSync('data', { recursive: true });

const connection = new DatabaseSync(
  process.env.DB_FILE || 'data/projects.db'
);

connection.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80),
    status TEXT NOT NULL CHECK(status IN ('Planned', 'In Progress', 'Completed'))
  )
`);

// Add date columns to existing databases without deleting records.
const columns = connection.prepare('PRAGMA table_info(projects)').all();
const columnNames = columns.map(column => column.name);

if (!columnNames.includes('startDate')) {
  connection.exec('ALTER TABLE projects ADD COLUMN startDate TEXT');
}

if (!columnNames.includes('deadline')) {
  connection.exec('ALTER TABLE projects ADD COLUMN deadline TEXT');
}

export const db = {
  async list() {
    return connection.prepare(`
      SELECT id, name, status, startDate, deadline
      FROM projects
      ORDER BY id DESC
    `).all();
  },

  async create({ name, status, startDate = '', deadline = '' }) {
    const result = connection.prepare(`
      INSERT INTO projects (name, status, startDate, deadline)
      VALUES (?, ?, ?, ?)
    `).run(name, status, startDate || null, deadline || null);

    return connection.prepare(`
      SELECT id, name, status, startDate, deadline
      FROM projects WHERE id = ?
    `).get(Number(result.lastInsertRowid));
  },

  async update(id, {
    name,
    status,
    startDate = '',
    deadline = ''
  }) {
    const result = connection.prepare(`
      UPDATE projects
      SET name = ?, status = ?, startDate = ?, deadline = ?
      WHERE id = ?
    `).run(name, status, startDate || null, deadline || null, id);

    if (!result.changes) return null;

    return connection.prepare(`
      SELECT id, name, status, startDate, deadline
      FROM projects WHERE id = ?
    `).get(id);
  },

  async remove(id) {
    return connection.prepare(
      'DELETE FROM projects WHERE id = ?'
    ).run(id).changes > 0;
  }
};
