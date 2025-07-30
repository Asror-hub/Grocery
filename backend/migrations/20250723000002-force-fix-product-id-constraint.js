'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, let's check if there are any existing constraints
    try {
      // Drop any existing foreign key constraints on product_id
      await queryInterface.removeConstraint('order_items', 'order_items_product_id_fkey');
    } catch (error) {
      console.log('No existing foreign key constraint found or already removed');
    }

    try {
      // Drop any existing check constraints that might enforce NOT NULL
      await queryInterface.removeConstraint('order_items', 'order_items_product_id_check');
    } catch (error) {
      console.log('No existing check constraint found or already removed');
    }

    // Now modify the column to allow null values
    await queryInterface.changeColumn('order_items', 'product_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id'
      }
    });

    // Add the foreign key constraint back with proper settings
    await queryInterface.addConstraint('order_items', {
      fields: ['product_id'],
      type: 'foreign key',
      name: 'order_items_product_id_fkey',
      references: {
        table: 'products',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the foreign key constraint
    await queryInterface.removeConstraint('order_items', 'order_items_product_id_fkey');
    
    // Restore the NOT NULL constraint
    await queryInterface.changeColumn('order_items', 'product_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    });
  }
}; 