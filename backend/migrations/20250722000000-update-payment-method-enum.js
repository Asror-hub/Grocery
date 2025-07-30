'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update existing 'online' payment methods to 'card'
    await queryInterface.sequelize.query(`
      UPDATE orders 
      SET payment_method = 'card' 
      WHERE payment_method = 'online'
    `);

    // Remove default value first
    await queryInterface.sequelize.query(`
      ALTER TABLE orders 
      ALTER COLUMN payment_method DROP DEFAULT
    `);

    // Drop the old enum type and create new one
    await queryInterface.sequelize.query(`
      ALTER TABLE orders 
      ALTER COLUMN payment_method TYPE VARCHAR(10)
    `);

    // Drop the old enum type if it exists
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_orders_payment_method"
    `);

    // Create new enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_orders_payment_method" AS ENUM('cash', 'card')
    `);

    // Alter column to use new enum
    await queryInterface.sequelize.query(`
      ALTER TABLE orders 
      ALTER COLUMN payment_method TYPE "enum_orders_payment_method" 
      USING payment_method::"enum_orders_payment_method"
    `);

    // Add default value back
    await queryInterface.sequelize.query(`
      ALTER TABLE orders 
      ALTER COLUMN payment_method SET DEFAULT 'cash'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Update existing 'card' payment methods back to 'online'
    await queryInterface.sequelize.query(`
      UPDATE orders 
      SET payment_method = 'online' 
      WHERE payment_method = 'card'
    `);

    // Remove default value first
    await queryInterface.sequelize.query(`
      ALTER TABLE orders 
      ALTER COLUMN payment_method DROP DEFAULT
    `);

    // Convert to VARCHAR first
    await queryInterface.sequelize.query(`
      ALTER TABLE orders 
      ALTER COLUMN payment_method TYPE VARCHAR(10)
    `);

    // Drop the new enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_orders_payment_method"
    `);

    // Create old enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_orders_payment_method" AS ENUM('cash', 'online')
    `);

    // Alter column to use old enum
    await queryInterface.sequelize.query(`
      ALTER TABLE orders 
      ALTER COLUMN payment_method TYPE "enum_orders_payment_method" 
      USING payment_method::"enum_orders_payment_method"
    `);

    // Add default value back
    await queryInterface.sequelize.query(`
      ALTER TABLE orders 
      ALTER COLUMN payment_method SET DEFAULT 'cash'
    `);
  }
}; 