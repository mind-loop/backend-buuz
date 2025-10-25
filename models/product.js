module.exports = function (sequelize, DataTypes) {
  const Product = sequelize.define(
    "product",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      img: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Зургийн замыг оруулна уу",
          },
        },
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Бүтээгдэхүүний нэрийг оруулна уу",
          },
        },
      },
      content: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: {
            msg: "Үнэ зөв тоон утгатай байх ёстой",
          },
        },
      },
      userId: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "product",
      timestamps: true,
    }
  );

  return Product;
};
