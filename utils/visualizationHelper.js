/**
 * Determines the best visualization type based on data characteristics
 * @param {string} groupBy - The grouping used in the query
 * @param {Array} results - The query results
 * @returns {string} The recommended chart type
 */
export function determineVisualizationType(groupBy, results) {
  // If there are too many data points, a bar chart might be better than a line chart
  if (results.length > 15) {
    return 'bar';
  }
  
  // For time series data, use a line chart
  if (groupBy === 'month' || groupBy === 'quarter' || groupBy === 'year') {
    return 'line';
  }
  
  // For categorical data with few categories, a pie chart might be appropriate
  if (results.length <= 5 && (groupBy === 'category' || groupBy === 'region')) {
    return 'pie';
  }
  
  // Default to a bar chart for most data
  return 'bar';
}

/**
 * Suggest additional visualizations based on data context
 * @param {string} queryType - The type of query
 * @param {Array} results - The query results
 * @returns {Array} List of suggested visualizations
 */
export function suggestAdditionalVisualizations(queryType, results) {
  const suggestions = [];
  
  // Add suggestions based on query type
  switch (queryType) {
    case 'revenue_analysis':
      suggestions.push({
        type: 'line',
        description: 'Trend over time'
      });
      break;
    case 'customer_analysis':
      suggestions.push({
        type: 'pie',
        description: 'Customer segment distribution'
      });
      break;
    case 'product_analysis':
      suggestions.push({
        type: 'bar',
        description: 'Product performance comparison'
      });
      break;
    case 'regional_analysis':
      suggestions.push({
        type: 'map',
        description: 'Geographic distribution'
      });
      break;
  }
  
  return suggestions;
}