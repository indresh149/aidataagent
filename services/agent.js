import { formatQuery } from '../utils/sqlFormatter.js';
import { determineVisualizationType } from '../utils/visualizationHelper.js';

/**
 * Generates a comprehensive response to a user's query
 * @param {string} query - The natural language query from the user
 * @param {Array} history - The conversation history
 * @param {object} db - The database connection
 * @returns {object} The generated response with answer and visualizations
 */
export async function generateResponse(query, history, db) {
  // In a production environment, this would connect to an actual LLM API
  // For this demo, we'll use predefined responses and SQL queries based on detection
  
  // Extract query intent and type
  const queryInfo = analyzeQuery(query);
  
  // Generate SQL query based on the intent
  let sqlQuery = '';
  try {
    sqlQuery = generateSqlQuery(queryInfo, db);
  } catch (error) {
    console.error("Error generating SQL query:", error);
    return {
      answer: "I'm having trouble understanding your question. Could you rephrase it or provide more specific details?",
      visualizations: []
    };
  }
  
  // Execute the generated query
  let queryResult;
  try {
    console.log("Executing SQL:", sqlQuery);
    queryResult = db.prepare(sqlQuery).all();
  } catch (error) {
    console.error("Error executing query:", error);
    return {
      answer: `I encountered an error when trying to analyze the data: ${error.message}. Could you try asking in a different way?`,
      visualizations: []
    };
  }
  
  // Generate natural language answer and visualizations
  const response = createResponse(query, queryInfo, queryResult, sqlQuery);
  
  return response;
}

/**
 * Analyzes a natural language query to determine its intent and parameters
 * @param {string} query - The user's natural language query
 * @returns {object} Information about the query intent and parameters
 */
function analyzeQuery(query) {
  // This is a simplified approach. In a real implementation, this would use
  // a language model to analyze the query in depth.
  
  const lowerQuery = query.toLowerCase();
  
  // Check for different query types
  if (
    lowerQuery.includes('revenue') || 
    lowerQuery.includes('sales') || 
    lowerQuery.includes('income')
  ) {
    return {
      type: 'revenue_analysis',
      timeframe: extractTimeframe(lowerQuery),
      groupBy: extractGroupBy(lowerQuery)
    };
  } else if (
    lowerQuery.includes('customer') ||
    lowerQuery.includes('client')
  ) {
    return {
      type: 'customer_analysis',
      limit: extractLimit(lowerQuery),
      metric: extractMetric(lowerQuery)
    };
  } else if (
    lowerQuery.includes('product') ||
    lowerQuery.includes('item') ||
    lowerQuery.includes('merchandise')
  ) {
    return {
      type: 'product_analysis',
      metric: extractMetric(lowerQuery),
      limit: extractLimit(lowerQuery)
    };
  } else if (
    lowerQuery.includes('region') ||
    lowerQuery.includes('location') ||
    lowerQuery.includes('country') ||
    lowerQuery.includes('state')
  ) {
    return {
      type: 'regional_analysis',
      metric: extractMetric(lowerQuery)
    };
  } else if (
    lowerQuery.includes('comparison') ||
    lowerQuery.includes('compare') ||
    lowerQuery.includes('versus') ||
    lowerQuery.includes('vs')
  ) {
    return {
      type: 'comparison',
      entities: extractComparisonEntities(lowerQuery),
      metric: extractMetric(lowerQuery)
    };
  } else {
    // Default to a general query type if we can't determine specific intent
    return {
      type: 'general_analysis',
      keywords: extractKeywords(lowerQuery)
    };
  }
}

/**
 * Extracts a timeframe from a query string
 */
function extractTimeframe(query) {
  if (query.includes('last year')) return 'last_year';
  if (query.includes('this year')) return 'this_year';
  if (query.includes('last month')) return 'last_month';
  if (query.includes('this month')) return 'this_month';
  if (query.includes('last quarter')) return 'last_quarter';
  if (query.includes('this quarter')) return 'this_quarter';
  if (query.includes('last 6 months') || query.includes('last six months')) return 'last_6_months';
  if (query.includes('last 3 months') || query.includes('last three months')) return 'last_3_months';
  return 'all_time'; // Default timeframe
}

/**
 * Extracts grouping information from a query string
 */
function extractGroupBy(query) {
  if (query.includes('by product') || query.includes('by each product')) return 'product';
  if (query.includes('by category') || query.includes('by product category')) return 'category';
  if (query.includes('by region') || query.includes('by location')) return 'region';
  if (query.includes('by customer') || query.includes('by client')) return 'customer';
  if (query.includes('by month') || query.includes('monthly')) return 'month';
  if (query.includes('by quarter') || query.includes('quarterly')) return 'quarter';
  if (query.includes('by year') || query.includes('yearly')) return 'year';
  return null;
}

/**
 * Extracts limit information from a query string
 */
function extractLimit(query) {
  const matches = query.match(/top (\d+)/i) || query.match(/(\d+) top/i);
  if (matches && matches[1]) {
    return parseInt(matches[1]);
  }
  
  if (query.includes('top 5')) return 5;
  if (query.includes('top 10')) return 10;
  if (query.includes('top 20')) return 20;
  return 10; // Default limit
}

/**
 * Extracts the metric to analyze from a query string
 */
function extractMetric(query) {
  if (query.includes('revenue') || query.includes('sales')) return 'revenue';
  if (query.includes('profit') || query.includes('margin')) return 'profit';
  if (query.includes('quantity') || query.includes('volume')) return 'quantity';
  if (query.includes('orders') || query.includes('purchases')) return 'orders';
  if (query.includes('satisfaction') || query.includes('rating')) return 'satisfaction';
  return 'revenue'; // Default metric
}

/**
 * Extracts entities being compared in a comparison query
 */
function extractComparisonEntities(query) {
  // This is a simplistic approach. A more sophisticated implementation would
  // use NLP to properly extract entities being compared.
  const entities = [];
  
  // Check for product categories
  if (query.includes('electronics')) entities.push('Electronics');
  if (query.includes('clothing')) entities.push('Clothing');
  if (query.includes('furniture')) entities.push('Furniture');
  if (query.includes('books')) entities.push('Books');
  if (query.includes('food')) entities.push('Food & Beverage');
  
  // Check for regions
  if (query.includes('north')) entities.push('North');
  if (query.includes('south')) entities.push('South');
  if (query.includes('east')) entities.push('East');
  if (query.includes('west')) entities.push('West');
  if (query.includes('central')) entities.push('Central');
  
  // Return default categories if none found
  return entities.length > 0 ? entities : ['Electronics', 'Clothing', 'Furniture'];
}

/**
 * Extracts keywords from a general query
 */
function extractKeywords(query) {
  // A real implementation would use more sophisticated NLP techniques
  return query.split(' ')
    .filter(word => word.length > 3)
    .filter(word => !['what', 'which', 'when', 'where', 'show', 'tell', 'give', 'find', 'about'].includes(word));
}

/**
 * Generates an SQL query based on the analyzed query intent
 * @param {object} queryInfo - Information about the query intent
 * @param {object} db - The database connection
 * @returns {string} The generated SQL query
 */
function generateSqlQuery(queryInfo, db) {
  const { type } = queryInfo;
  
  switch (type) {
    case 'revenue_analysis':
      return generateRevenueQuery(queryInfo);
    case 'customer_analysis':
      return generateCustomerQuery(queryInfo);
    case 'product_analysis':
      return generateProductQuery(queryInfo);
    case 'regional_analysis':
      return generateRegionalQuery(queryInfo);
    case 'comparison':
      return generateComparisonQuery(queryInfo);
    case 'general_analysis':
    default:
      return generateGeneralQuery(queryInfo);
  }
}

/**
 * Generates an SQL query for revenue analysis
 */
function generateRevenueQuery(queryInfo) {
  const { timeframe, groupBy } = queryInfo;
  
  let timeCondition = '';
  switch (timeframe) {
    case 'last_year':
      timeCondition = "WHERE strftime('%Y', o.order_date) = strftime('%Y', 'now', '-1 year')";
      break;
    case 'this_year':
      timeCondition = "WHERE strftime('%Y', o.order_date) = strftime('%Y', 'now')";
      break;
    case 'last_month':
      timeCondition = "WHERE strftime('%Y-%m', o.order_date) = strftime('%Y-%m', 'now', '-1 month')";
      break;
    case 'this_month':
      timeCondition = "WHERE strftime('%Y-%m', o.order_date) = strftime('%Y-%m', 'now')";
      break;
    case 'last_quarter':
      timeCondition = "WHERE o.order_date BETWEEN date('now', '-6 month') AND date('now', '-3 month')";
      break;
    case 'this_quarter':
      timeCondition = "WHERE o.order_date BETWEEN date('now', '-3 month') AND date('now')";
      break;
    case 'last_6_months':
      timeCondition = "WHERE o.order_date BETWEEN date('now', '-6 month') AND date('now')";
      break;
    case 'last_3_months':
      timeCondition = "WHERE o.order_date BETWEEN date('now', '-3 month') AND date('now')";
      break;
    default:
      timeCondition = ''; // No time condition for all_time
  }
  
  let groupByClause = '';
  let selectClause = '';
  
  switch (groupBy) {
    case 'product':
      groupByClause = 'GROUP BY p.product_name';
      selectClause = 'p.product_name as name';
      break;
    case 'category':
      groupByClause = 'GROUP BY p.category';
      selectClause = 'p.category as name';
      break;
    case 'region':
      groupByClause = 'GROUP BY c.region';
      selectClause = 'c.region as name';
      break;
    case 'customer':
      groupByClause = 'GROUP BY c.customer_name';
      selectClause = 'c.customer_name as name';
      break;
    case 'month':
      groupByClause = "GROUP BY strftime('%Y-%m', o.order_date)";
      selectClause = "strftime('%Y-%m', o.order_date) as name";
      break;
    case 'quarter':
      groupByClause = "GROUP BY strftime('%Y-Q', o.order_date)";
      selectClause = "strftime('%Y') || '-Q' || CAST((strftime('%m', o.order_date) - 1) / 3 + 1 AS TEXT) as name";
      break;
    case 'year':
      groupByClause = "GROUP BY strftime('%Y', o.order_date)";
      selectClause = "strftime('%Y', o.order_date) as name";
      break;
    default:
      // If no groupBy is specified, group by month for a time series
      groupByClause = "GROUP BY strftime('%Y-%m', o.order_date)";
      selectClause = "strftime('%Y-%m', o.order_date) as name";
  }
  
  const query = `
    SELECT 
      ${selectClause},
      SUM(oi.quantity * oi.unit_price) as revenue,
      SUM(oi.quantity) as units_sold
    FROM 
      orders o
    JOIN 
      order_items oi ON o.order_id = oi.order_id
    JOIN 
      products p ON oi.product_id = p.product_id
    JOIN 
      customers c ON o.customer_id = c.customer_id
    ${timeCondition}
    ${groupByClause}
    ORDER BY 
      revenue DESC
  `;
  
  return formatQuery(query);
}

/**
 * Generates an SQL query for customer analysis
 */
function generateCustomerQuery(queryInfo) {
  const { limit, metric } = queryInfo;
  
  let orderBy = '';
  let additionalSelect = '';
  
  switch (metric) {
    case 'revenue':
      orderBy = 'total_revenue DESC';
      additionalSelect = 'SUM(oi.quantity * oi.unit_price) as total_revenue';
      break;
    case 'orders':
      orderBy = 'order_count DESC';
      additionalSelect = 'COUNT(DISTINCT o.order_id) as order_count';
      break;
    case 'quantity':
      orderBy = 'total_items DESC';
      additionalSelect = 'SUM(oi.quantity) as total_items';
      break;
    default:
      orderBy = 'total_revenue DESC';
      additionalSelect = 'SUM(oi.quantity * oi.unit_price) as total_revenue';
  }
  
  const query = `
    SELECT 
      c.customer_id,
      c.customer_name,
      c.segment,
      c.region,
      ${additionalSelect},
      COUNT(DISTINCT o.order_id) as order_count,
      ROUND(AVG(oi.quantity * oi.unit_price), 2) as avg_order_value,
      MAX(o.order_date) as last_purchase_date
    FROM 
      customers c
    JOIN 
      orders o ON c.customer_id = o.customer_id
    JOIN 
      order_items oi ON o.order_id = oi.order_id
    GROUP BY 
      c.customer_id, c.customer_name, c.segment, c.region
    ORDER BY 
      ${orderBy}
    LIMIT ${limit}
  `;
  
  return formatQuery(query);
}

/**
 * Generates an SQL query for product analysis
 */
function generateProductQuery(queryInfo) {
  const { metric, limit } = queryInfo;
  
  let orderBy = '';
  let additionalSelect = '';
  
  switch (metric) {
    case 'revenue':
      orderBy = 'total_revenue DESC';
      additionalSelect = 'SUM(oi.quantity * oi.unit_price) as total_revenue';
      break;
    case 'profit':
      orderBy = 'total_profit DESC';
      additionalSelect = 'SUM(oi.quantity * (oi.unit_price - p.product_cost)) as total_profit';
      break;
    case 'quantity':
      orderBy = 'units_sold DESC';
      additionalSelect = 'SUM(oi.quantity) as units_sold';
      break;
    default:
      orderBy = 'total_revenue DESC';
      additionalSelect = 'SUM(oi.quantity * oi.unit_price) as total_revenue';
  }
  
  const query = `
    SELECT 
      p.product_id,
      p.product_name,
      p.category,
      ${additionalSelect},
      SUM(oi.quantity) as units_sold,
      COUNT(DISTINCT o.order_id) as order_count,
      ROUND(AVG(oi.unit_price), 2) as avg_selling_price
    FROM 
      products p
    JOIN 
      order_items oi ON p.product_id = oi.product_id
    JOIN 
      orders o ON oi.order_id = o.order_id
    GROUP BY 
      p.product_id, p.product_name, p.category
    ORDER BY 
      ${orderBy}
    LIMIT ${limit}
  `;
  
  return formatQuery(query);
}

/**
 * Generates an SQL query for regional analysis
 */
function generateRegionalQuery(queryInfo) {
  const { metric } = queryInfo;
  
  let metricSelect = '';
  
  switch (metric) {
    case 'revenue':
      metricSelect = 'SUM(oi.quantity * oi.unit_price) as total_revenue';
      break;
    case 'profit':
      metricSelect = 'SUM(oi.quantity * (oi.unit_price - p.product_cost)) as total_profit';
      break;
    case 'orders':
      metricSelect = 'COUNT(DISTINCT o.order_id) as order_count';
      break;
    default:
      metricSelect = 'SUM(oi.quantity * oi.unit_price) as total_revenue';
  }
  
  const query = `
    SELECT 
      c.region,
      ${metricSelect},
      COUNT(DISTINCT c.customer_id) as customer_count,
      COUNT(DISTINCT o.order_id) as order_count,
      SUM(oi.quantity) as total_units,
      ROUND(AVG(oi.quantity * oi.unit_price), 2) as avg_order_value
    FROM 
      customers c
    JOIN 
      orders o ON c.customer_id = o.customer_id
    JOIN 
      order_items oi ON o.order_id = oi.order_id
    JOIN 
      products p ON oi.product_id = p.product_id
    GROUP BY 
      c.region
    ORDER BY 
      ${metric === 'profit' ? 'total_profit' : 
        metric === 'orders' ? 'order_count' : 'total_revenue'} DESC
  `;
  
  return formatQuery(query);
}

/**
 * Generates an SQL query for comparison analysis
 */
function generateComparisonQuery(queryInfo) {
  const { entities, metric } = queryInfo;
  
  let entityType = '';
  let entityColumn = '';
  
  // Determine the type of entities being compared
  if (entities.some(e => ['Electronics', 'Clothing', 'Furniture', 'Books', 'Food & Beverage'].includes(e))) {
    entityType = 'category';
    entityColumn = 'p.category';
  } else if (entities.some(e => ['North', 'South', 'East', 'West', 'Central'].includes(e))) {
    entityType = 'region';
    entityColumn = 'c.region';
  } else {
    // Default to product category if we can't determine
    entityType = 'category';
    entityColumn = 'p.category';
  }
  
  // Prepare the IN clause for the entities
  const entitiesString = entities.map(e => `'${e}'`).join(', ');
  
  let metricSelect = '';
  let orderBy = '';
  
  switch (metric) {
    case 'revenue':
      metricSelect = 'SUM(oi.quantity * oi.unit_price) as total_revenue';
      orderBy = 'total_revenue DESC';
      break;
    case 'profit':
      metricSelect = 'SUM(oi.quantity * (oi.unit_price - p.product_cost)) as total_profit';
      orderBy = 'total_profit DESC';
      break;
    case 'quantity':
      metricSelect = 'SUM(oi.quantity) as total_units';
      orderBy = 'total_units DESC';
      break;
    case 'orders':
      metricSelect = 'COUNT(DISTINCT o.order_id) as order_count';
      orderBy = 'order_count DESC';
      break;
    default:
      metricSelect = 'SUM(oi.quantity * oi.unit_price) as total_revenue';
      orderBy = 'total_revenue DESC';
  }
  
  // Monthly trend if we're comparing entities
  const query = `
    SELECT 
      ${entityColumn} as name,
      strftime('%Y-%m', o.order_date) as month,
      ${metricSelect}
    FROM 
      orders o
    JOIN 
      order_items oi ON o.order_id = oi.order_id
    JOIN 
      products p ON oi.product_id = p.product_id
    JOIN 
      customers c ON o.customer_id = c.customer_id
    WHERE 
      ${entityColumn} IN (${entitiesString})
    GROUP BY 
      ${entityColumn}, strftime('%Y-%m', o.order_date)
    ORDER BY 
      name, month
  `;
  
  return formatQuery(query);
}

/**
 * Generates a general SQL query based on extracted keywords
 */
function generateGeneralQuery(queryInfo) {
  const { keywords } = queryInfo;
  
  // Default to a general overview query if we can't determine specifics
  const query = `
    SELECT 
      strftime('%Y-%m', o.order_date) as month,
      SUM(oi.quantity * oi.unit_price) as total_revenue,
      COUNT(DISTINCT o.order_id) as order_count,
      COUNT(DISTINCT o.customer_id) as customer_count,
      SUM(oi.quantity) as units_sold,
      ROUND(AVG(oi.quantity * oi.unit_price), 2) as avg_order_value
    FROM 
      orders o
    JOIN 
      order_items oi ON o.order_id = oi.order_id
    GROUP BY 
      month
    ORDER BY 
      month
  `;
  
  return formatQuery(query);
}

/**
 * Creates a comprehensive response with natural language answer and visualizations
 * @param {string} query - The original query
 * @param {object} queryInfo - Information about the query intent
 * @param {Array} queryResult - The result of the SQL query
 * @param {string} sqlQuery - The executed SQL query
 * @returns {object} The response with answer and visualizations
 */
function createResponse(query, queryInfo, queryResult, sqlQuery) {
  const { type } = queryInfo;
  
  // Generate the appropriate response based on the query type and results
  switch (type) {
    case 'revenue_analysis':
      return createRevenueResponse(query, queryInfo, queryResult, sqlQuery);
    case 'customer_analysis':
      return createCustomerResponse(query, queryInfo, queryResult, sqlQuery);
    case 'product_analysis':
      return createProductResponse(query, queryInfo, queryResult, sqlQuery);
    case 'regional_analysis':
      return createRegionalResponse(query, queryInfo, queryResult, sqlQuery);
    case 'comparison':
      return createComparisonResponse(query, queryInfo, queryResult, sqlQuery);
    case 'general_analysis':
    default:
      return createGeneralResponse(query, queryInfo, queryResult, sqlQuery);
  }
}

/**
 * Creates a response for revenue analysis queries
 */
function createRevenueResponse(query, queryInfo, results, sqlQuery) {
  const { timeframe, groupBy } = queryInfo;
  
  // Extract needed metrics
  const totalRevenue = results.reduce((sum, row) => sum + row.revenue, 0);
  const formattedRevenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(totalRevenue);
  
  // Determine timeframe description
  let timeDescription = '';
  switch (timeframe) {
    case 'last_year':
      timeDescription = 'last year';
      break;
    case 'this_year':
      timeDescription = 'this year';
      break;
    case 'last_month':
      timeDescription = 'last month';
      break;
    case 'this_month':
      timeDescription = 'this month';
      break;
    case 'last_quarter':
      timeDescription = 'last quarter';
      break;
    case 'this_quarter':
      timeDescription = 'this quarter';
      break;
    case 'last_6_months':
      timeDescription = 'the last 6 months';
      break;
    case 'last_3_months':
      timeDescription = 'the last 3 months';
      break;
    default:
      timeDescription = 'all time';
  }
  
  // Determine grouping description
  let groupDescription = '';
  switch (groupBy) {
    case 'product':
      groupDescription = 'by product';
      break;
    case 'category':
      groupDescription = 'by product category';
      break;
    case 'region':
      groupDescription = 'by region';
      break;
    case 'customer':
      groupDescription = 'by customer';
      break;
    case 'month':
      groupDescription = 'by month';
      break;
    case 'quarter':
      groupDescription = 'by quarter';
      break;
    case 'year':
      groupDescription = 'by year';
      break;
    default:
      groupDescription = 'over time';
  }
  
  // Generate the natural language answer
  let answer = `## Revenue Analysis ${groupDescription} for ${timeDescription}\n\n`;
  answer += `The total revenue for ${timeDescription} was **${formattedRevenue}**.\n\n`;
  
  // Add insights based on the data
  if (results.length > 0) {
    const topItem = results[0];
    const topName = topItem.name;
    const topRevenue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(topItem.revenue);
    
    answer += `The highest revenue ${groupDescription === 'over time' ? 'period' : groupBy} was **${topName}** with **${topRevenue}**`;
    
    if (topItem.units_sold) {
      answer += `, selling ${topItem.units_sold.toLocaleString()} units.\n\n`;
    } else {
      answer += `.\n\n`;
    }
    
    // Include SQL query for transparency
    answer += `### Details\n\n`;
    answer += `I've analyzed the revenue data ${groupDescription} for ${timeDescription} and created the visualizations below.\n`;
    answer += `You can see the detailed breakdown in the chart and table.\n\n`;
  }
  
  // Determine the best visualization type
  const vizType = determineVisualizationType(groupBy, results);
  
  // Prepare chart data
  const chartData = {
    chartType: vizType,
    chartData: {
      labels: results.map(r => r.name),
      datasets: [
        {
          label: 'Revenue',
          data: results.map(r => r.revenue),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    },
    chartOptions: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      }
    }
  };
  
  // Prepare table data
  const tableData = {
    columns: ['name', 'revenue', 'units_sold'],
    rows: results.map(r => ({
      name: r.name,
      revenue: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(r.revenue),
      units_sold: r.units_sold ? r.units_sold.toLocaleString() : 'N/A'
    }))
  };
  
  // Create visualizations
  const visualizations = [
    {
      type: 'chart',
      title: `Revenue ${groupDescription} for ${timeDescription}`,
      data: chartData
    },
    {
      type: 'table',
      title: `Revenue Data ${groupDescription}`,
      data: tableData
    }
  ];
  
  // Add SQL details for transparency (in a real app, this might be toggleable or only for advanced users)
  answer += `\`\`\`visualization:chart:Revenue Analysis\n${JSON.stringify(chartData)}\n\`\`\`\n\n`;
  answer += `\`\`\`visualization:table:Detailed Revenue Data\n${JSON.stringify(tableData)}\n\`\`\`\n\n`;
  
  return {
    answer,
    visualizations
  };
}

/**
 * Creates a response for customer analysis queries
 */
function createCustomerResponse(query, queryInfo, results, sqlQuery) {
  const { limit, metric } = queryInfo;
  
  // Generate natural language answer
  let answer = `## Top ${limit} Customers by ${metric === 'revenue' ? 'Revenue' : metric === 'orders' ? 'Order Count' : 'Purchase Volume'}\n\n`;
  
  // Add insights based on the data
  if (results.length > 0) {
    const topCustomer = results[0];
    let metricValue = '';
    
    switch (metric) {
      case 'revenue':
        metricValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(topCustomer.total_revenue);
        answer += `Your top customer is **${topCustomer.customer_name}** with a total revenue of **${metricValue}**.\n\n`;
        break;
      case 'orders':
        metricValue = topCustomer.order_count.toLocaleString();
        answer += `Your top customer by order count is **${topCustomer.customer_name}** with **${metricValue}** orders.\n\n`;
        break;
      case 'quantity':
        metricValue = topCustomer.total_items.toLocaleString();
        answer += `Your top customer by purchase volume is **${topCustomer.customer_name}** who purchased **${metricValue}** items.\n\n`;
        break;
      default:
        metricValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(topCustomer.total_revenue);
        answer += `Your top customer is **${topCustomer.customer_name}** with a total revenue of **${metricValue}**.\n\n`;
    }
    
    // Additional insights
    answer += `### Customer Segments\n\n`;
    
    // Group by segment and calculate totals
    const segments = {};
    results.forEach(customer => {
      if (!segments[customer.segment]) {
        segments[customer.segment] = {
          count: 0,
          revenue: 0,
          orders: 0
        };
      }
      
      segments[customer.segment].count++;
      if (customer.total_revenue) segments[customer.segment].revenue += customer.total_revenue;
      if (customer.order_count) segments[customer.segment].orders += customer.order_count;
    });
    
    // Add segment insights
    const segmentInsights = Object.entries(segments)
      .map(([segment, data]) => {
        const revFormatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(data.revenue);
        
        return `- ${segment}: ${data.count} customers, ${data.orders} orders, ${revFormatted} total revenue`;
      })
      .join('\n');
    
    answer += `${segmentInsights}\n\n`;
    
    // Include summary
    answer += `### Details\n\n`;
    answer += `I've analyzed your top ${limit} customers based on ${metric === 'revenue' ? 'revenue generated' : metric === 'orders' ? 'number of orders placed' : 'quantity of items purchased'}.\n`;
    answer += `You can see the detailed breakdown in the visualizations below.\n\n`;
  }
  
  // Prepare chart data
  const chartData = {
    chartType: 'bar',
    chartData: {
      labels: results.map(r => r.customer_name),
      datasets: [
        {
          label: metric === 'revenue' ? 'Revenue' : metric === 'orders' ? 'Order Count' : 'Items Purchased',
          data: results.map(r => 
            metric === 'revenue' ? r.total_revenue : 
            metric === 'orders' ? r.order_count : 
            r.total_items
          ),
          backgroundColor: results.map((_, i) => `rgba(54, 162, ${235 - i * 10}, 0.2)`),
          borderColor: results.map((_, i) => `rgba(54, 162, ${235 - i * 10}, 1)`),
          borderWidth: 1
        }
      ]
    },
    chartOptions: {
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              if (metric === 'revenue') return '$' + value.toLocaleString();
              return value.toLocaleString();
            }
          }
        }
      }
    }
  };
  
  // Prepare table data with appropriate column formatting
  const tableData = {
    columns: ['customer_name', 'segment', 'region', 
              metric === 'revenue' ? 'total_revenue' : 
              metric === 'orders' ? 'order_count' : 
              'total_items',
              'avg_order_value', 'last_purchase_date'],
    rows: results.map(r => {
      const row = {
        customer_name: r.customer_name,
        segment: r.segment,
        region: r.region
      };
      
      // Add the metric-specific column
      if (metric === 'revenue') {
        row.total_revenue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(r.total_revenue);
      } else if (metric === 'orders') {
        row.order_count = r.order_count.toLocaleString();
      } else {
        row.total_items = r.total_items.toLocaleString();
      }
      
      // Add common columns
      row.avg_order_value = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(r.avg_order_value);
      
      row.last_purchase_date = new Date(r.last_purchase_date).toLocaleDateString();
      
      return row;
    })
  };
  
  // Create visualizations
  answer += `\`\`\`visualization:chart:Top Customers\n${JSON.stringify(chartData)}\n\`\`\`\n\n`;
  answer += `\`\`\`visualization:table:Customer Details\n${JSON.stringify(tableData)}\n\`\`\`\n\n`;
  
  return {
    answer,
    visualizations: []
  };
}

/**
 * Creates a response for product analysis queries
 */
function createProductResponse(query, queryInfo, results, sqlQuery) {
  const { metric, limit } = queryInfo;
  
  // Generate natural language answer
  let answer = `## Top ${limit} Products by ${metric === 'revenue' ? 'Revenue' : metric === 'profit' ? 'Profit' : 'Units Sold'}\n\n`;
  
  // Add insights based on the data
  if (results.length > 0) {
    const topProduct = results[0];
    let metricValue = '';
    
    switch (metric) {
      case 'revenue':
        metricValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(topProduct.total_revenue);
        answer += `Your top product is **${topProduct.product_name}** with a total revenue of **${metricValue}**.\n\n`;
        break;
      case 'profit':
        metricValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(topProduct.total_profit);
        answer += `Your most profitable product is **${topProduct.product_name}** with a total profit of **${metricValue}**.\n\n`;
        break;
      case 'quantity':
        metricValue = topProduct.units_sold.toLocaleString();
        answer += `Your best-selling product by volume is **${topProduct.product_name}** with **${metricValue}** units sold.\n\n`;
        break;
      default:
        metricValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(topProduct.total_revenue);
        answer += `Your top product is **${topProduct.product_name}** with a total revenue of **${metricValue}**.\n\n`;
    }
    
    // Additional insights
    answer += `### Product Categories\n\n`;
    
    // Group by category and calculate totals
    const categories = {};
    results.forEach(product => {
      if (!categories[product.category]) {
        categories[product.category] = {
          count: 0,
          revenue: 0,
          profit: 0,
          units: 0
        };
      }
      
      categories[product.category].count++;
      if (product.total_revenue) categories[product.category].revenue += product.total_revenue;
      if (product.total_profit) categories[product.category].profit += product.total_profit;
      if (product.units_sold) categories[product.category].units += product.units_sold;
    });
    
    // Add category insights
    const categoryInsights = Object.entries(categories)
      .map(([category, data]) => {
        let insight = `- ${category}: ${data.count} products`;
        
        if (metric === 'revenue' || metric === 'profit') {
          const value = metric === 'revenue' ? data.revenue : data.profit;
          const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(value);
          insight += `, ${formatted} total ${metric}`;
        }
        
        if (data.units) {
          insight += `, ${data.units.toLocaleString()} units sold`;
        }
        
        return insight;
      })
      .join('\n');
    
    answer += `${categoryInsights}\n\n`;
    
    // Include summary
    answer += `### Details\n\n`;
    answer += `I've analyzed your top ${limit} products based on ${metric === 'revenue' ? 'revenue generated' : metric === 'profit' ? 'profit margin' : 'quantity sold'}.\n`;
    answer += `You can see the detailed breakdown in the visualizations below.\n\n`;
  }
  
  // Prepare chart data
  const chartData = {
    chartType: 'bar',
    chartData: {
      labels: results.map(r => r.product_name),
      datasets: [
        {
          label: metric === 'revenue' ? 'Revenue' : metric === 'profit' ? 'Profit' : 'Units Sold',
          data: results.map(r => 
            metric === 'revenue' ? r.total_revenue : 
            metric === 'profit' ? r.total_profit : 
            r.units_sold
          ),
          backgroundColor: results.map((_, i) => `rgba(75, 192, ${100 + i * 10}, 0.2)`),
          borderColor: results.map((_, i) => `rgba(75, 192, ${100 + i * 10}, 1)`),
          borderWidth: 1
        }
      ]
    },
    chartOptions: {
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              if (metric === 'revenue' || metric === 'profit') {
                return '$' + value.toLocaleString();
              }
              return value.toLocaleString();
            }
          }
        }
      }
    }
  };
  
  // Prepare table data with appropriate column formatting
  const tableData = {
    columns: ['product_name', 'category', 
              metric === 'revenue' ? 'total_revenue' : 
              metric === 'profit' ? 'total_profit' : 
              'units_sold',
              'order_count', 'avg_selling_price'],
    rows: results.map(r => {
      const row = {
        product_name: r.product_name,
        category: r.category
      };
      
      // Add the metric-specific column
      if (metric === 'revenue') {
        row.total_revenue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(r.total_revenue);
      } else if (metric === 'profit') {
        row.total_profit = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(r.total_profit);
      } else {
        row.units_sold = r.units_sold.toLocaleString();
      }
      
      // Add common columns
      row.order_count = r.order_count.toLocaleString();
      row.avg_selling_price = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(r.avg_selling_price);
      
      return row;
    })
  };
  
  // Create visualizations
  answer += `\`\`\`visualization:chart:Top Products\n${JSON.stringify(chartData)}\n\`\`\`\n\n`;
  answer += `\`\`\`visualization:table:Product Details\n${JSON.stringify(tableData)}\n\`\`\`\n\n`;
  
  return {
    answer,
    visualizations: []
  };
}

/**
 * Creates a response for regional analysis queries
 */
function createRegionalResponse(query, queryInfo, results, sqlQuery) {
  const { metric } = queryInfo;
  
  // Generate natural language answer
  let answer = `## Regional Analysis by ${metric === 'revenue' ? 'Revenue' : metric === 'profit' ? 'Profit' : metric === 'orders' ? 'Order Count' : 'Sales'}\n\n`;
  
  // Add insights based on the data
  if (results.length > 0) {
    // Sort results by the appropriate metric
    let sortedResults = [...results].sort((a, b) => {
      if (metric === 'revenue') return b.total_revenue - a.total_revenue;
      if (metric === 'profit') return b.total_profit - a.total_profit;
      if (metric === 'orders') return b.order_count - a.order_count;
      return b.total_revenue - a.total_revenue;
    });
    
    const topRegion = sortedResults[0];
    let metricValue = '';
    
    switch (metric) {
      case 'revenue':
        metricValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(topRegion.total_revenue);
        answer += `Your top performing region is **${topRegion.region}** with a total revenue of **${metricValue}**.\n\n`;
        break;
      case 'profit':
        metricValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(topRegion.total_profit);
        answer += `Your most profitable region is **${topRegion.region}** with a total profit of **${metricValue}**.\n\n`;
        break;
      case 'orders':
        metricValue = topRegion.order_count.toLocaleString();
        answer += `Your region with the highest order count is **${topRegion.region}** with **${metricValue}** orders.\n\n`;
        break;
      default:
        metricValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(topRegion.total_revenue);
        answer += `Your top performing region is **${topRegion.region}** with a total revenue of **${metricValue}**.\n\n`;
    }
    
    // Additional insights - calculate region percentages
    let totalMetric = 0;
    results.forEach(region => {
      if (metric === 'revenue') totalMetric += region.total_revenue;
      else if (metric === 'profit') totalMetric += region.total_profit;
      else if (metric === 'orders') totalMetric += region.order_count;
      else totalMetric += region.total_revenue;
    });
    
    answer += `### Regional Distribution\n\n`;
    answer += `Here's how your business is distributed across regions:\n\n`;
    
    const regionInsights = results
      .map(region => {
        let metricValue = 0;
        if (metric === 'revenue') metricValue = region.total_revenue;
        else if (metric === 'profit') metricValue = region.total_profit;
        else if (metric === 'orders') metricValue = region.order_count;
        else metricValue = region.total_revenue;
        
        const percentage = (metricValue / totalMetric * 100).toFixed(1);
        
        let formattedValue = '';
        if (metric === 'revenue' || metric === 'profit') {
          formattedValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(metricValue);
        } else {
          formattedValue = metricValue.toLocaleString();
        }
        
        return `- **${region.region}**: ${formattedValue} (${percentage}%)`;
      })
      .join('\n');
    
    answer += `${regionInsights}\n\n`;
    
    // Customer insights
    answer += `### Customer Insights\n\n`;
    
    const customerInsights = results
      .map(region => {
        const avgValue = region.total_units > 0 
          ? region.total_units / region.order_count 
          : 0;
        
        return `- **${region.region}** has ${region.customer_count.toLocaleString()} customers with an average order value of ${region.avg_order_value ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(region.avg_order_value) : '$0.00'}`;
      })
      .join('\n');
    
    answer += `${customerInsights}\n\n`;
    
    // Include summary
    answer += `### Details\n\n`;
    answer += `I've analyzed your regional performance based on ${metric === 'revenue' ? 'revenue generated' : metric === 'profit' ? 'profit' : metric === 'orders' ? 'number of orders' : 'sales'}.\n`;
    answer += `You can see the detailed breakdown in the visualizations below.\n\n`;
  }
  
  // Prepare chart data - use pie chart for regions
  const chartData = {
    chartType: 'pie',
    chartData: {
      labels: results.map(r => r.region),
      datasets: [
        {
          data: results.map(r => 
            metric === 'revenue' ? r.total_revenue : 
            metric === 'profit' ? r.total_profit : 
            metric === 'orders' ? r.order_count :
            r.total_revenue
          ),
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }
      ]
    },
    chartOptions: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed !== undefined) {
                if (metric === 'revenue' || metric === 'profit') {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(context.parsed);
                } else {
                  label += context.parsed.toLocaleString();
                }
              }
              return label;
            }
          }
        }
      }
    }
  };
  
  // Prepare table data with appropriate column formatting
  const tableData = {
    columns: ['region', 
              metric === 'revenue' ? 'total_revenue' : 
              metric === 'profit' ? 'total_profit' : 
              metric === 'orders' ? 'order_count' :
              'total_revenue',
              'customer_count', 'order_count', 'total_units', 'avg_order_value'],
    rows: results.map(r => {
      const row = {
        region: r.region,
        customer_count: r.customer_count.toLocaleString(),
        order_count: r.order_count.toLocaleString(),
        total_units: r.total_units.toLocaleString(),
        avg_order_value: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(r.avg_order_value)
      };
      
      // Add the metric-specific column
      if (metric === 'revenue') {
        row.total_revenue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(r.total_revenue);
      } else if (metric === 'profit') {
        row.total_profit = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(r.total_profit);
      } else if (metric === 'orders') {
        // Already added above
      } else {
        row.total_revenue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(r.total_revenue);
      }
      
      return row;
    })
  };
  
  // Create visualizations
  answer += `\`\`\`visualization:chart:Regional Distribution\n${JSON.stringify(chartData)}\n\`\`\`\n\n`;
  answer += `\`\`\`visualization:table:Regional Details\n${JSON.stringify(tableData)}\n\`\`\`\n\n`;
  
  return {
    answer,
    visualizations: []
  };
}

/**
 * Creates a response for comparison analysis queries
 */
function createComparisonResponse(query, queryInfo, results, sqlQuery) {
  const { entities, metric } = queryInfo;
  
  // Generate natural language answer
  let entityType = '';
  if (results.length > 0) {
    // Check the name column of the first result to determine entity type
    const firstEntity = results[0].name;
    if (['Electronics', 'Clothing', 'Furniture', 'Books', 'Food & Beverage'].includes(firstEntity)) {
      entityType = 'Product Categories';
    } else if (['North', 'South', 'East', 'West', 'Central'].includes(firstEntity)) {
      entityType = 'Regions';
    } else {
      entityType = 'Items';
    }
  }
  
  let answer = `## Comparison of ${entityType} by ${metric === 'revenue' ? 'Revenue' : metric === 'profit' ? 'Profit' : metric === 'quantity' ? 'Units Sold' : metric === 'orders' ? 'Order Count' : 'Performance'}\n\n`;
  
  // Process results to create a time series for each entity
  if (results.length > 0) {
    // Group results by entity
    const entitiesData = {};
    
    results.forEach(row => {
      if (!entitiesData[row.name]) {
        entitiesData[row.name] = {
          data: [],
          total: 0
        };
      }
      
      let value = 0;
      if (metric === 'revenue') value = row.total_revenue;
      else if (metric === 'profit') value = row.total_profit;
      else if (metric === 'quantity') value = row.total_units;
      else if (metric === 'orders') value = row.order_count;
      else value = row.total_revenue;
      
      entitiesData[row.name].data.push({
        month: row.month,
        value
      });
      
      entitiesData[row.name].total += value;
    });
    
    // Sort entities by total values
    const sortedEntities = Object.entries(entitiesData)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data]) => name);
    
    // Generate insights
    if (sortedEntities.length > 0) {
      const topEntity = sortedEntities[0];
      const topEntityData = entitiesData[topEntity];
      
      let metricLabel = '';
      let metricValue = '';
      
      switch (metric) {
        case 'revenue':
          metricLabel = 'revenue';
          metricValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(topEntityData.total);
          break;
        case 'profit':
          metricLabel = 'profit';
          metricValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(topEntityData.total);
          break;
        case 'quantity':
          metricLabel = 'units sold';
          metricValue = topEntityData.total.toLocaleString();
          break;
        case 'orders':
          metricLabel = 'orders';
          metricValue = topEntityData.total.toLocaleString();
          break;
        default:
          metricLabel = 'revenue';
          metricValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(topEntityData.total);
      }
      
      answer += `Based on the analysis, **${topEntity}** has the highest ${metricLabel} with **${metricValue}**.\n\n`;
      
      // Compare entities
      if (sortedEntities.length > 1) {
        answer += `### Comparison Summary\n\n`;
        
        const entityInsights = sortedEntities.map(entity => {
          const data = entitiesData[entity];
          const formattedValue = metric === 'revenue' || metric === 'profit'
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.total)
            : data.total.toLocaleString();
          
          return `- **${entity}**: ${formattedValue}`;
        }).join('\n');
        
        answer += `${entityInsights}\n\n`;
        
        // Trends analysis
        answer += `### Trend Analysis\n\n`;
        
        // Get trends for top entities
        const topEntitiesForTrend = sortedEntities.slice(0, Math.min(3, sortedEntities.length));
        
        // Calculate month-over-month growth for each entity
        const trendInsights = topEntitiesForTrend.map(entity => {
          const monthlyData = entitiesData[entity].data;
          
          if (monthlyData.length < 2) {
            return `- **${entity}**: Not enough data to calculate trend`;
          }
          
          // Sort by month
          monthlyData.sort((a, b) => a.month.localeCompare(b.month));
          
          // Calculate growth between first and last month
          const firstMonth = monthlyData[0];
          const lastMonth = monthlyData[monthlyData.length - 1];
          
          if (firstMonth.value === 0) {
            return `- **${entity}**: No data available for the first month`;
          }
          
          const growthPercent = ((lastMonth.value - firstMonth.value) / firstMonth.value * 100).toFixed(1);
          const trend = growthPercent >= 0 ? 'increased' : 'decreased';
          
          return `- **${entity}** has ${trend} by ${Math.abs(growthPercent)}% from ${firstMonth.month} to ${lastMonth.month}`;
        }).join('\n');
        
        answer += `${trendInsights}\n\n`;
      }
      
      // Include summary
      answer += `### Details\n\n`;
      answer += `I've analyzed the performance of different ${entityType.toLowerCase()} based on ${metricLabel}.\n`;
      answer += `The line chart below shows the trend over time for each ${entityType.toLowerCase().slice(0, -1)}.\n\n`;
    }
    
    // Create datasets for line chart
    const uniqueMonths = [...new Set(results.map(r => r.month))].sort();
    
    // Prepare chart data - use line chart for time series comparison
    const chartData = {
      chartType: 'line',
      chartData: {
        labels: uniqueMonths,
        datasets: sortedEntities.map((entity, index) => {
          // Generate data points for all months (fill in zeros for missing months)
          const data = uniqueMonths.map(month => {
            const monthData = entitiesData[entity].data.find(d => d.month === month);
            return monthData ? monthData.value : 0;
          });
          
          return {
            label: entity,
            data,
            borderColor: getColor(index, 'border'),
            backgroundColor: getColor(index, 'background'),
            tension: 0.1,
            fill: false
          };
        })
      },
      chartOptions: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (metric === 'revenue' || metric === 'profit') {
                  return '$' + value.toLocaleString();
                }
                return value.toLocaleString();
              }
            }
          }
        }
      }
    };
    
    // Prepare aggregate table data
    const tableData = {
      columns: ['name', 'total', 'average', 'max', 'min'],
      rows: sortedEntities.map(entity => {
        const data = entitiesData[entity].data;
        const values = data.map(d => d.value);
        const total = entitiesData[entity].total;
        const avg = total / data.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        const formatValue = (value) => {
          if (metric === 'revenue' || metric === 'profit') {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(value);
          }
          return value.toLocaleString();
        };
        
        return {
          name: entity,
          total: formatValue(total),
          average: formatValue(avg),
          max: formatValue(max),
          min: formatValue(min)
        };
      })
    };
    
    // Create visualizations
    answer += `\`\`\`visualization:chart:Comparison Over Time\n${JSON.stringify(chartData)}\n\`\`\`\n\n`;
    answer += `\`\`\`visualization:table:Performance Summary\n${JSON.stringify(tableData)}\n\`\`\`\n\n`;
  }
  
  return {
    answer,
    visualizations: []
  };
}

/**
 * Creates a response for general analysis queries
 */
function createGeneralResponse(query, queryInfo, results, sqlQuery) {
  // Generate a default response for general queries
  let answer = `## Business Overview Analysis\n\n`;
  
  // Add insights based on the data
  if (results.length > 0) {
    // Calculate totals
    const totalRevenue = results.reduce((sum, row) => sum + row.total_revenue, 0);
    const totalOrders = results.reduce((sum, row) => sum + row.order_count, 0);
    const totalCustomers = results.reduce((sum, row) => sum + row.customer_count, 0);
    const totalUnits = results.reduce((sum, row) => sum + row.units_sold, 0);
    
    const formattedRevenue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(totalRevenue);
    
    // Basic summary
    answer += `Here's an overview of your business performance:\n\n`;
    answer += `- Total revenue: **${formattedRevenue}**\n`;
    answer += `- Total orders: **${totalOrders.toLocaleString()}**\n`;
    answer += `- Total customers: **${totalCustomers.toLocaleString()}**\n`;
    answer += `- Total units sold: **${totalUnits.toLocaleString()}**\n\n`;
    
    // Trend analysis
    if (results.length > 1) {
      // Sort results by month
      const sortedResults = [...results].sort((a, b) => a.month.localeCompare(b.month));
      const firstMonth = sortedResults[0];
      const lastMonth = sortedResults[sortedResults.length - 1];
      
      // Calculate growth
      const revenueGrowth = ((lastMonth.total_revenue - firstMonth.total_revenue) / firstMonth.total_revenue * 100).toFixed(1);
      const ordersGrowth = ((lastMonth.order_count - firstMonth.order_count) / firstMonth.order_count * 100).toFixed(1);
      
      answer += `### Trend Analysis\n\n`;
      answer += `From ${firstMonth.month} to ${lastMonth.month}:\n\n`;
      
      if (revenueGrowth > 0) {
        answer += `- Revenue has **increased by ${revenueGrowth}%**\n`;
      } else if (revenueGrowth < 0) {
        answer += `- Revenue has **decreased by ${Math.abs(revenueGrowth)}%**\n`;
      } else {
        answer += `- Revenue has **remained stable**\n`;
      }
      
      if (ordersGrowth > 0) {
        answer += `- Order count has **increased by ${ordersGrowth}%**\n`;
      } else if (ordersGrowth < 0) {
        answer += `- Order count has **decreased by ${Math.abs(ordersGrowth)}%**\n`;
      } else {
        answer += `- Order count has **remained stable**\n`;
      }
      
      answer += `\n`;
      
      // Key metrics
      const avgOrderValue = totalRevenue / totalOrders;
      const formattedAOV = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(avgOrderValue);
      
      const avgUnitsPerOrder = totalUnits / totalOrders;
      
      answer += `### Key Performance Indicators\n\n`;
      answer += `- Average Order Value (AOV): **${formattedAOV}**\n`;
      answer += `- Average Units per Order: **${avgUnitsPerOrder.toFixed(2)}**\n`;
      answer += `- Orders per Customer: **${(totalOrders / totalCustomers).toFixed(2)}**\n\n`;
    }
    
    // Include summary
    answer += `### Details\n\n`;
    answer += `I've analyzed your overall business performance and created visualizations to show the trends over time.\n`;
    answer += `You can see the detailed breakdown in the chart and table below.\n\n`;
  }
  
  // Prepare chart data
  if (results.length > 0) {
    // Sort results by month
    const sortedResults = [...results].sort((a, b) => a.month.localeCompare(b.month));
    
    const chartData = {
      chartType: 'line',
      chartData: {
        labels: sortedResults.map(r => r.month),
        datasets: [
          {
            label: 'Revenue',
            data: sortedResults.map(r => r.total_revenue),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            yAxisID: 'y',
            tension: 0.1
          },
          {
            label: 'Orders',
            data: sortedResults.map(r => r.order_count),
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            yAxisID: 'y1',
            tension: 0.1
          }
        ]
      },
      chartOptions: {
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Revenue'
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: true,
              text: 'Orders'
            }
          }
        }
      }
    };
    
    // Prepare table data
    const tableData = {
      columns: ['month', 'total_revenue', 'order_count', 'customer_count', 'units_sold', 'avg_order_value'],
      rows: sortedResults.map(r => ({
        month: r.month,
        total_revenue: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(r.total_revenue),
        order_count: r.order_count.toLocaleString(),
        customer_count: r.customer_count.toLocaleString(),
        units_sold: r.units_sold.toLocaleString(),
        avg_order_value: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(r.avg_order_value)
      }))
    };
    
    // Create visualizations
    answer += `\`\`\`visualization:chart:Business Performance Over Time\n${JSON.stringify(chartData)}\n\`\`\`\n\n`;
    answer += `\`\`\`visualization:table:Monthly Performance Metrics\n${JSON.stringify(tableData)}\n\`\`\`\n\n`;
  }
  
  return {
    answer,
    visualizations: []
  };
}

/**
 * Helper function to get a color for chart visualization
 */
function getColor(index, type) {
  const colors = [
    { border: 'rgba(54, 162, 235, 1)', background: 'rgba(54, 162, 235, 0.2)' },
    { border: 'rgba(255, 99, 132, 1)', background: 'rgba(255, 99, 132, 0.2)' },
    { border: 'rgba(255, 206, 86, 1)', background: 'rgba(255, 206, 86, 0.2)' },
    { border: 'rgba(75, 192, 192, 1)', background: 'rgba(75, 192, 192, 0.2)' },
    { border: 'rgba(153, 102, 255, 1)', background: 'rgba(153, 102, 255, 0.2)' },
    { border: 'rgba(255, 159, 64, 1)', background: 'rgba(255, 159, 64, 0.2)' },
    { border: 'rgba(199, 199, 199, 1)', background: 'rgba(199, 199, 199, 0.2)' },
    { border: 'rgba(83, 102, 255, 1)', background: 'rgba(83, 102, 255, 0.2)' },
    { border: 'rgba(255, 99, 71, 1)', background: 'rgba(255, 99, 71, 0.2)' },
    { border: 'rgba(144, 238, 144, 1)', background: 'rgba(144, 238, 144, 0.2)' }
  ];
  
  const colorIndex = index % colors.length;
  return colors[colorIndex][type];
}