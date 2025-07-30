'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'comment', {
      type: Sequelize.TEXT,
      allowNull: true,
      field: 'comment'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('orders', 'comment');
  }
}; 