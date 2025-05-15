/**
 * Initializes the database with sample data for the AI Data Agent
 * @param {object} db - The database connection
 */
export function initializeDatabase(db) {
  try {
    // Check if the database has already been initialized
    const tablesExist = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='products'
    `).get();
    
    if (tablesExist) {
      console.log('Database already initialized');
      return;
    }
    
    console.log('Initializing database with sample data...');
    
    // Create tables
    db.exec(`
      -- Products table
      CREATE TABLE products (
        product_id TEXT PRIMARY KEY,
        product_name TEXT NOT NULL,
        category TEXT,
        product_cost REAL,
        retail_price REAL
      );
      
      -- Customers table
      CREATE TABLE customers (
        customer_id TEXT PRIMARY KEY,
        customer_name TEXT,
        segment TEXT,
        region TEXT,
        created_at TEXT
      );
      
      -- Orders table
      CREATE TABLE orders (
        order_id TEXT PRIMARY KEY,
        customer_id TEXT,
        order_date TEXT,
        status TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
      );
      
      -- Order Items table
      CREATE TABLE order_items (
        order_item_id TEXT PRIMARY KEY,
        order_id TEXT,
        product_id TEXT,
        quantity INTEGER,
        unit_price REAL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      );
    `);
    
    // Insert sample product data
    const insertProduct = db.prepare(`
      INSERT INTO products (product_id, product_name, category, product_cost, retail_price)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const products = [
      ['P1001', 'Smartphone XS', 'Electronics', 399.99, 799.99],
      ['P1002', 'Laptop Pro', 'Electronics', 699.99, 1299.99],
      ['P1003', 'Wireless Headphones', 'Electronics', 89.99, 199.99],
      ['P1004', 'Smart Watch', 'Electronics', 129.99, 249.99],
      ['P1005', 'Coffee Maker', 'Home Appliances', 59.99, 119.99],
      ['P1006', 'Designer T-Shirt', 'Clothing', 15.99, 49.99],
      ['P1007', 'Premium Jeans', 'Clothing', 39.99, 89.99],
      ['P1008', 'Running Shoes', 'Footwear', 49.99, 129.99],
      ['P1009', 'Office Chair', 'Furniture', 149.99, 299.99],
      ['P1010', 'Dining Table', 'Furniture', 299.99, 599.99],
      ['P1011', 'Professional Camera', 'Electronics', 499.99, 1099.99],
      ['P1012', 'Bluetooth Speaker', 'Electronics', 69.99, 149.99],
      ['P1013', 'Designer Handbag', 'Accessories', 199.99, 499.99],
      ['P1014', 'Leather Wallet', 'Accessories', 29.99, 79.99],
      ['P1015', 'Fitness Tracker', 'Electronics', 59.99, 129.99],
      ['P1016', 'Microwave Oven', 'Home Appliances', 89.99, 179.99],
      ['P1017', 'Winter Jacket', 'Clothing', 79.99, 199.99],
      ['P1018', 'Sunglasses', 'Accessories', 49.99, 129.99],
      ['P1019', 'Blender', 'Home Appliances', 39.99, 89.99],
      ['P1020', 'Sofa Set', 'Furniture', 599.99, 1299.99]
    ];
    
    for (const product of products) {
      insertProduct.run(...product);
    }
    
    // Insert sample customer data
    const insertCustomer = db.prepare(`
      INSERT INTO customers (customer_id, customer_name, segment, region, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const segments = ['Consumer', 'Corporate', 'Home Office'];
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    
    const customers = [
      ['C1001', 'John Smith', segments[0], regions[0], '2022-01-15'],
      ['C1002', 'Acme Corporation', segments[1], regions[1], '2022-01-20'],
      ['C1003', 'Sarah Johnson', segments[0], regions[2], '2022-02-05'],
      ['C1004', 'Tech Solutions Inc', segments[1], regions[3], '2022-02-10'],
      ['C1005', 'Michael Brown', segments[0], regions[4], '2022-02-15'],
      ['C1006', 'Global Trading Co', segments[1], regions[0], '2022-03-01'],
      ['C1007', 'Emma Wilson', segments[0], regions[1], '2022-03-10'],
      ['C1008', 'Home Office Supplies', segments[2], regions[2], '2022-03-15'],
      ['C1009', 'Robert Garcia', segments[0], regions[3], '2022-03-20'],
      ['C1010', 'Supreme Furniture', segments[1], regions[4], '2022-04-05'],
      ['C1011', 'Jennifer Lee', segments[0], regions[0], '2022-04-10'],
      ['C1012', 'Digital Nomad Co', segments[2], regions[1], '2022-04-15'],
      ['C1013', 'David Clark', segments[0], regions[2], '2022-04-20'],
      ['C1014', 'Fashion Forward Inc', segments[1], regions[3], '2022-05-01'],
      ['C1015', 'Creative Studios', segments[2], regions[4], '2022-05-10'],
      ['C1016', 'Elite Consulting', segments[1], regions[0], '2022-05-15'],
      ['C1017', 'Alex Rodriguez', segments[0], regions[1], '2022-05-20'],
      ['C1018', 'Healthy Living Co', segments[1], regions[2], '2022-06-01'],
      ['C1019', 'Patricia Young', segments[0], regions[3], '2022-06-10'],
      ['C1020', 'Office Evolution', segments[2], regions[4], '2022-06-15']
    ];
    
    for (const customer of customers) {
      insertCustomer.run(...customer);
    }
    
    // Insert sample order data
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_id, customer_id, order_date, status)
      VALUES (?, ?, ?, ?)
    `);
    
    // Insert sample order items
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    // Generate order data spanning multiple months
    const statuses = ['Completed', 'Shipped', 'Processing', 'Cancelled'];
    let orderCounter = 1;
    let orderItemCounter = 1;
    
    // Generate orders for the past 12 months
    for (let month = 1; month <= 12; month++) {
      // Generate orders for each month
      const numOrders = 50 + Math.floor(Math.random() * 30); // 50-80 orders per month
      
      for (let i = 0; i < numOrders; i++) {
        const orderId = `O${String(orderCounter).padStart(4, '0')}`;
        const customerId = customers[Math.floor(Math.random() * customers.length)][0];
        
        // Random day in the month
        const day = Math.floor(Math.random() * 28) + 1;
        const orderDate = `2023-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const status = statuses[Math.floor(Math.random() * (statuses.length - 1))]; // Bias toward completed orders
        
        insertOrder.run(orderId, customerId, orderDate, status);
        
        // Generate 1-5 items per order
        const numItems = Math.floor(Math.random() * 5) + 1;
        
        // Keep track of products already in this order to avoid duplicates
        const orderProducts = new Set();
        
        for (let j = 0; j < numItems; j++) {
          // Randomly select a product not already in this order
          let productIndex;
          let productId;
          
          do {
            productIndex = Math.floor(Math.random() * products.length);
            productId = products[productIndex][0];
          } while (orderProducts.has(productId));
          
          orderProducts.add(productId);
          
          const orderItemId = `OI${String(orderItemCounter).padStart(4, '0')}`;
          const quantity = Math.floor(Math.random() * 3) + 1;
          
          // Price might vary slightly from retail price (sales, discounts, etc.)
          const retailPrice = products[productIndex][4];
          const randomFactor = 0.85 + Math.random() * 0.15; // 0.85 to 1.0
          const unitPrice = Math.round(retailPrice * randomFactor * 100) / 100;
          
          insertOrderItem.run(orderItemId, orderId, productId, quantity, unitPrice);
          
          orderItemCounter++;
        }
        
        orderCounter++;
      }
    }
    
    console.log('Database initialization complete');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}