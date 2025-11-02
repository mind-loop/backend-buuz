/* models/orderItem.js */
export default function (sequelize, DataTypes) {
  const OrderItems = sequelize.define(
    "order_items",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
      },
      productId: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        references: {
          model: "product",
          key: "id",
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: "order_items",
      timestamps: true,
    }
  );

  OrderItems.associate = (models) => {
    OrderItems.belongsTo(models.Orders, { foreignKey: "orderId", as: "order" });
  };
  OrderItems.associate = (models) => {
    OrderItems.belongsTo(models.Orders, { foreignKey: "productId", as: "product" });
  };

  return OrderItems;
};