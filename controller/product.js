const asyncHandler = require("../middleware/asyncHandle");
const MyError = require("../utils/myError");
const paginateSequelize = require("../utils/paginate-sequelize");

exports.createProduct = asyncHandler(async (req, res, next) => {
    const { userId } = req
    if (!userId) {
        throw new MyError(`Та эрхгүй байна`, 400)
    }
    await req.db.product.create({ ...req.body, userId: userId })
    res.status(200).json({
        message: "Бүтээгдэхүүн шинээр нэмэгдлээ",
        body: { success: true },
    });
})

exports.getProducts = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const sort = req.query.sort;
    let select = req.query.select;

    if (select) {
        select = select.split(" ");
    }

    ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

    const pagination = await paginateSequelize(page, limit, req.db.product);

    let query = { offset: pagination.start - 1, limit };

    if (req.query) {
        query.where = req.query;
    }

    if (select) {
        query.attributes = select;
    }

    if (sort) {
        query.order = sort
            .split(" ")
            .map((el) => [
                el.charAt(0) === "-" ? el.substring(1) : el,
                el.charAt(0) === "-" ? "DESC" : "ASC",
            ]);
    }

    const product = await req.db.product.findAll({
        ...query, include: [{
            model: req.db.users,
            as: "user",
            attributes: ["id", "name", "email"]
        }]
    });
    res.status(200).json({
        success: true,
        items: product,
        pagination,
    });
});
exports.getProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const product = await req.db.product.findByPk(id, {
        include: [{
            model: req.db.users, as: "user",
            attributes: ["id", "name", "email"]
        }]
    });
    if (!product) {
        throw new MyError(`${id}  дугаартай бүтээгдэхүүн олдсонгүй`, 404)
    }
    res.status(200).json({
        success: true,
        body: product,
    });
});
exports.updateProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // 1️⃣ Тухайн бүтээгдэхүүнийг олно
  const product = await req.db.product.findByPk(id);

  if (!product) {
    throw new MyError("Бүтээгдэхүүн олдсонгүй", 404);
  }

  // 2️⃣ Өгөгдлийг шинэчилнэ
  await product.update(req.body);

  // 3️⃣ Амжилттай хариу буцаана
  res.status(200).json({
    success: true,
    message: "Бүтээгдэхүүн амжилттай шинэчлэгдлээ",
    product,
  });
});

exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // 1️⃣ Тухайн бүтээгдэхүүнийг олно
  const product = await req.db.product.findByPk(id);

  if (!product) {
    throw new MyError("Бүтээгдэхүүн олдсонгүй", 404);
  }

  // 2️⃣ Өгөгдлийг шинэчилнэ
  await product.destroy();

  // 3️⃣ Амжилттай хариу буцаана
  res.status(200).json({
    success: true,
    message: "Бүтээгдэхүүн амжилттай устгагдлаа",
  });
});