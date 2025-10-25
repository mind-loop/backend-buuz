const express = require("express");
const dotenv = require("dotenv");
var path = require("path");
const fileUpload = require("express-fileupload");
var rfs = require("rotating-file-stream");
const colors = require("colors");
const errorHandler = require("./middleware/error");
var morgan = require("morgan");
const logger = require("./middleware/logger");
// Router оруулж ирэх
const userRoutes = require("./routes/users");
const clientRoutes = require("./routes/client");
const productRoutes = require("./routes/product")
const orderRoutes=require("./routes/order")
const successRoutes = require("./routes/success");
const injectDb = require("./middleware/injectDb");
const cors = require("cors");
// Аппын тохиргоог process.env рүү ачаалах



dotenv.config({ path: "./config/config.env" });

const db = require("./config/db-mysql");
const { expiredCheckDepartments } = require("./services/cronJobs");
const checkMongoliaOnly = require("./middleware/checker");
const { emitWarning } = require("process");

const app = express();

// create a write stream (in append mode)
var accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
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
