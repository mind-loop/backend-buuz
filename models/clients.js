/* jshint indent: 1 */
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

module.exports = function (sequelize, DataTypes) {
  const Clients = sequelize.define(
    "clients",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Та нэрээ оруулна уу",
          },
        },
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
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          is: {
            args: /^[0-9]{6,12}$/,
            msg: "Утасны дугаар зөвхөн тооноос бүрдэх ёстой",
          },
        },
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: {
            args: [0, 255],
            msg: "Байршлын урт хэтэрсэн байна",
          },
        },
      },
      resetPasswordToken: {
        type: DataTypes.STRING,
      },
      resetPasswordExpire: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "clients",
      timestamps: true,
    }
  );

  // ---- Hooks ----
  Clients.beforeCreate(async (user) => {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  });

  Clients.beforeUpdate(async (user) => {
    // зөвхөн password өөрчлөгдсөн үед hash хийх
    if (user.changed("password")) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  });

  // ---- Prototype methods ----

  // JWT үүсгэх
  Clients.prototype.getJsonWebToken = function () {
    const token = jwt.sign(
      {
        id: this.id,
        email: this.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return token;
  };

  // Нууц үг шалгах
  Clients.prototype.CheckPass = async function (pass) {
    return await bcrypt.compare(pass, this.password);
  };

  // Нууц үг сэргээх token үүсгэх
  Clients.prototype.generatePasswordChangeToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
  };

  return Clients;
};
