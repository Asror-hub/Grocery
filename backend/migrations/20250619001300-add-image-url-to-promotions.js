'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('promotions', 'image_url', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'quantity_free'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('promotions', 'image_url');
  }
}; 