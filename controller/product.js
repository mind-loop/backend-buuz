import asyncHandler from "../middleware/asyncHandle.js";
import MyError from "../utils/myError.js";
import paginateSequelize from "../utils/paginate-sequelize.js";
export const createProduct = asyncHandler(async (req, res, next) => {
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

export const getProducts = asyncHandler(async (req, res, next) => {
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
        body: {
            items: product,
            pagination
        },
    });
});
export const getProduct = asyncHandler(async (req, res, next) => {
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
export const updateProduct = asyncHandler(async (req, res, next) => {
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

export const deleteProduct = asyncHandler(async (req, res, next) => {
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
export const getProductStats = asyncHandler(async (req, res, next) => {
  const { userId } = req
  if (!userId) {
    throw new MyError(`Та эрхгүй байна`, 400)
  }

  res.status(200).json({
    success: true,
  });
})