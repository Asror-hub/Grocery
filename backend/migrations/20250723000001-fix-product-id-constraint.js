'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the NOT NULL constraint from product_id column
    await queryInterface.changeColumn('order_items', 'product_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Restore the NOT NULL constraint (if needed)
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