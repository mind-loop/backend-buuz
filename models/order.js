/* jshint indent: 1 */
module.exports = function (sequelize, DataTypes) {
  const Orders = sequelize.define(
    "orders",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      clientId: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        references: {
          model: "clients",
          key: "id",
        }
      },
      total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      status: {
        type: DataTypes.ENUM("basket","pending", "processing", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "basket",
      },
      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: "cash",
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "orders",
      timestamps: true,
    }
  );

  return Orders;
};
