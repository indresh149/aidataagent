import { format } from 'sql-formatter';

/**
 * Formats an SQL query for better readability
 * @param {string} query - The SQL query to format
 * @returns {string} The formatted SQL query
 */
export function formatQuery(query) {
  // Use sql-formatter to clean up the query
  return format(query, {
    language: 'sqlite',
    uppercase: true,
    linesBetweenQueries: 2,
    indentStyle: 'standard'
  });
}