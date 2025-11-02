import SequelizePkg from "sequelize";
const { Sequelize,Op } = SequelizePkg;
import usersModel from "../models/users.js";
import clientsModel from "../models/clients.js";
import productModel from "../models/product.js";
import orderModel from "../models/order.js";
import orderItemsModel from "../models/ordetItems.js";

import dotenv from "dotenv";
dotenv.config({ path: "./config/config.env" });

var db = {};

const sequelize = new Sequelize(
  process.env.SEQUELIZE_DATABASE,
  process.env.SEQUELIZE_USER,
  process.env.SEQUELIZE_USER_PASSWORD,
  {
    host: process.env.SEQUELIZE_HOST,
    port: process.env.SEQUELIZE_PORT,
    dialect: process.env.SEQUELIZE_DIALECT || "mysql",
    define: {
      freezeTableName: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    
eratorAliases: false,
  }
);
const models = [
  usersModel,
  clientsModel,
  productModel,
  orderModel,
  orderItemsModel,
];

models.forEach((model) => {
  const seqModel = model(sequelize, Sequelize);
  console.log("==>", seqModel.name);
  db[seqModel.name] = seqModel;
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Op = Op;
export default db;