// Allowed values, kept in one place so validation and SQL stay in sync
// with the ENUM columns defined in database/schema.sql.
export const TASK_STATUSES = ['PENDING', 'COMPLETED'];
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

export const TITLE_MAX_LENGTH = 150;
export const DESCRIPTION_MAX_LENGTH = 5000;
export const SEARCH_MAX_LENGTH = 100;
