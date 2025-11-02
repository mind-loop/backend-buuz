import express from "express";
import dotenv from "dotenv";
import path from "path";
import fileUpload from "express-fileupload";
import rfs from "rotating-file-stream";
import colors from "colors";
import errorHandler from "./middleware/error.js";
import morgan from "morgan";
import logger from "./middleware/logger.js";

// Router-ууд
import userRoutes from "./routes/users.js";
import clientRoutes from "./routes/client.js";
import productRoutes from "./routes/product.js";
import orderRoutes from "./routes/order.js";
import successRoutes from "./routes/success.js";

import injectDb from "./middleware/injectDb.js";
import cors from "cors";
// Аппын тохиргоог process.env рүү ачаалах

dotenv.config({ path: "./config/config.env" });

import db from "./config/db-mysql.js";
import { fileURLToPath } from "url";
const app = express();
// __dirname үүсгэх
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// create a write stream (in append mode)
const accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // өдөр тутам rotate
  path: path.join(__dirname, "log"),
});

// Body parser
app.use(express.json());
app.use(fileUpload());
app.use(cors());
app.use(logger);
app.use(injectDb(db));
app.use(express.static("public"));
app.use(morgan("combined", { stream: accessLogStream }));
app.use("/api/user", userRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/product", productRoutes);
app.use("/api/order", orderRoutes);
app.use("/api", successRoutes);
app.use(errorHandler);
db.users.hasMany(db.product, { foreignkey: "user_id", onDelete: "CASCADE" });
db.product.belongsTo(db.users);
db.orders.hasMany(db.order_items, { foreignkey: "orderId", onDelete: "CASCADE" });
db.order_items.belongsTo(db.orders);
db.order_items.belongsTo(db.product, { foreignKey: "productId", as: "product" });
db.product.hasMany(db.order_items, { foreignKey: "productId" });

db.orders.belongsTo(db.clients, { foreignKey: "clientId", as: "clients" });
db.clients.hasMany(db.orders, { foreignKey: "clientId" });
db.sequelize
  .sync()
  .then((result) => {
    console.log("sync hiigdlee...");
  })
  .catch((err) => console.log(err));


const server = app.listen(
  process.env.PORT,
  console.log(`Express сэрвэр ${process.env.PORT} порт дээр аслаа... `.rainbow)
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Алдаа гарлаа : ${err.message}`.underline.red.bold);
  server.close(() => {
    process.exit(1);
  });
});
