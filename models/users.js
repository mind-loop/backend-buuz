/* jshint indent: 1 */
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
module.exports = function (sequelize, DataTypes) {
  const User = sequelize.define(
    "users",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
       role: {
        type: DataTypes.ENUM("admin"),
        allowNull: false,
        defaultValue: "admin",
      },
      name: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Та нэрээ оруулна уу",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Та нууц үгээ оруулна уу",
          },
          len: {
            args: [4, 100],
            msg: "Таны нууц үг хэт богино байна",
          },
        },
        select: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: "Заавал имэйл оруулна уу",
          },
          notContains: {
            args: ["миа"],
            msg: "Энэ мэссэжд хориглогдсон үг байна.",
          },
        },
      },
      resetPasswordToken: {
        type: DataTypes.STRING(10),
      },
      resetPasswordExpire: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );
  User.beforeCreate(async (user) => {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  });

  User.beforeUpdate(async (user) => {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  });

  // Generate JWT
  User.prototype.getJsonWebToken = function () {
    const token = jwt.sign(
      {
        id: this.id,
        email: this.email,
        role: this.role,
      },
      process.env.JWT_SECRET
    );
    return token;
  };

  // Check password
  User.prototype.CheckPass = async function (pass) {
    return await bcrypt.compare(pass, this.password);
  };

  User.prototype.generatePasswordChangeToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    return resetToken;
  };

  return User;
};
