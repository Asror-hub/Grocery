'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('order_items', 'item_type', {
      type: Sequelize.ENUM('product', 'box'),
      allowNull: false,
      defaultValue: 'product',
      field: 'item_type'
    });

    await queryInterface.addColumn('order_items', 'box_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: 'box_id',
      references: {
        model: 'promotions',
        key: 'id'
      }
    });

    await queryInterface.addColumn('order_items', 'box_title', {
      type: Sequelize.STRING,
      allowNull: true,
      field: 'box_title'
    });

    await queryInterface.addColumn('order_items', 'box_description', {
      type: Sequelize.TEXT,
      allowNull: true,
      field: 'box_description'
    });

    await queryInterface.addColumn('order_items', 'box_products', {
      type: Sequelize.JSON,
      allowNull: true,
      field: 'box_products'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('order_items', 'item_type');
    await queryInterface.removeColumn('order_items', 'box_id');
    await queryInterface.removeColumn('order_items', 'box_title');
    await queryInterface.removeColumn('order_items', 'box_description');
    await queryInterface.removeColumn('order_items', 'box_products');
  }
}; 