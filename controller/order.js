const { Op, Sequelize } = require("sequelize");
const asyncHandler = require("../middleware/asyncHandle")
const MyError = require("../utils/myError");
const paginateSequelize = require("../utils/paginate-sequelize");
const { includes } = require("lodash");
const { model } = require("mongoose");
// createOrders=>Items
exports.createOrder = asyncHandler(async (req, res, next) => {
  const { userId } = req;
  if (!userId) {
    throw new MyError("Та эрхгүй байна", 400);
  }

  const { productId, quantity } = req.body;

  // Барааны мэдээллийг авах
  const product = await req.db.product.findByPk(productId);
  if (!product) {
    throw new MyError("Бүтээгдэхүүн олдсонгүй", 404);
  }

  // Одоогийн 'basket' төлөвтэй захиалгыг хайх
  let order = await req.db.orders.findOne({
    where: { clientId: userId, status: "basket" },
  });
  const now = new Date();
  if (!order) {
    // Шинэ захиалга үүсгэх
    const subtotal = product.price * quantity;
    order = await req.db.orders.create({
      clientId: userId,
      note: "-",
      order_number: now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        now.getDate().toString().padStart(2, "0") +
        now.getHours().toString().padStart(2, "0") +
        now.getMinutes().toString().padStart(2, "0") +
        now.getSeconds().toString().padStart(2, "0"),
      total_price: subtotal,
      status: "basket",
    });

    await req.db.order_items.create({
      orderId: order.id,
      productId,
      price: product.price,
      quantity,
      subtotal,
    });
  } else {
    // Хэрэв product аль хэдийн order-д байгаа эсэхийг шалгах
    let orderItem = await req.db.order_items.findOne({
      where: { orderId: order.id, productId },
    });

    if (orderItem) {
      // Update хийх: quantity болон subtotal нэмэгдүүлэх
      await orderItem.update({
        quantity: quantity,
        subtotal: product.price * quantity,
      });
    } else {
      // Шинэ order_item үүсгэх
      await req.db.order_items.create({
        orderId: order.id,
        productId,
        price: product.price,
        quantity,
        subtotal: product.price * quantity,
      });
    }

    // Захиалгын нийт үнийг шинэчлэх
    const total = await req.db.order_items.sum("subtotal", {
      where: { orderId: order.id },
    });
    await order.update({ total_price: total });
  }

  // Захиалгын item-уудыг авах
  const items = await req.db.order_items.findAll({
    where: { orderId: order.id },
  });

  res.status(200).json({
    success: true,
    message: "Захиалга амжилттай бүртгэгдлээ",
    order: {
      ...order.toJSON(),
      items,
    },
  });
});

exports.statusChangeOrder = asyncHandler(async (req, res, next) => {
  const { orderId, status } = req.body;
  if (!orderId || !status) {
    throw new MyError("orderId болон status заавал шаардлагатай", 400);
  }
  // Захиалгыг хайх
  const order = await req.db.orders.findByPk(orderId);
  if (!order) {
    throw new MyError("Захиалга олдсонгүй", 404);
  }
  // Төлөвийг update хийх
  await order.update({ status });
  res.status(200).json({
    success: true,
    message: `Захиалгын төлөв амжилттай ${status} болголоо`,
    order,
  });
});

//Энэ нь тухайн захиалагчийн сагсанд байгааг items-г энийгээр дуудаж харуулна. 
exports.getOrderBasket = asyncHandler(async (req, res, next) => {
  const { userId } = req
  if (!userId) {
    throw new MyError(`Та эрхгүй байна`, 400)
  }
  const order = await req.db.orders.findOne({
    where: { status: 'basket', clientId: userId }, include: [
      {
        model: req.db.order_items,
        as: "order_items",
        include: {
          model: req.db.product,
          as: "product",
        },
      }
    ]
  })
  res.status(200).json({
    success: true,
    body: order,
  });
})

// Төлөгдөөгүй
exports.getStatus = asyncHandler(async (req, res, next) => {
  const { userId } = req
  console.log(req.role)
  if (!userId) {
    throw new MyError(`Та эрхгүй байна`, 400)
  }
  const whereCondition = {
    status: req.body.status,
    ...(req.role !== "admin" && { clientId: req.userId })
  };
  const order = await req.db.orders.findAll({
    where: whereCondition, include: [{
      model: req.db.order_items,
      as: "order_items",
      include: {
        model: req.db.product,
        as: "product",
      },
    }]
  })
  res.status(200).json({
    success: true,
    body: { items: order },
  });
})
// Төлөгдөөгүй
exports.getStats = asyncHandler(async (req, res, next) => {
  const { userId } = req
  if (!userId) {
    throw new MyError(`Та эрхгүй байна`, 400)
  }
  const statsRaw = await req.db.orders.findAll({
    attributes: [
      "status",
      [Sequelize.fn("SUM", Sequelize.col("total_price")), "total_amount"],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "total_qty"],
    ],
    group: ["status"],
  });

  // Model instance → plain object
  const stats = statsRaw.map((item) => item.get({ plain: true }));

  // key-value объект болгон хувиргах
  const statsObj = {};
  stats.forEach((item) => {
    statsObj[item.status] = {
      total_qty: parseInt(item.total_qty, 10),
      total_amount: parseFloat(item.total_amount),
    };
  });


  res.status(200).json({
    success: true,
    body: statsObj,
  });
})
exports.getOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  const sort = req.query.sort;
  let select = req.query.select;

  if (select) {
    select = select.split(" ");
  }

  // Filter copy хийж, хязгаарлах параметрүүдийг устгах
  const filters = { ...req.query };
  ["select", "sort", "page", "limit"].forEach((el) => delete filters[el]);
  filters.status = { [Op.ne]: "basket" }; // basket-ээс ялгаатай захиалгууд

  // Pagination тооцоолох
  const pagination = await paginateSequelize(page, limit, req.db.orders, filters);

  // Query-г бэлдэх
  const query = {
    where: filters,
    offset: (page - 1) * limit,
    limit,
  };

  if (select) query.attributes = select;

  if (sort) {
    query.order = sort.split(" ").map((el) => [
      el.charAt(0) === "-" ? el.substring(1) : el,
      el.charAt(0) === "-" ? "DESC" : "ASC",
    ]);
  }

  // Data-г авах
  const orders = await req.db.orders.findAll(query);

  res.status(200).json({
    success: true,
    body: {
      items: orders,
      pagination,
    }
  });
});

exports.getOrder = asyncHandler(async (req, res, next) => {
  const { userId } = req
  if (!userId) {
    throw new MyError(`Та эрхгүй байна`, 400)
  }
  const order = await req.db.orders.findByPk(req.params.id,
    {
      include: [
        {
          model: req.db.order_items,
          as: "order_items",
          include: {
            model: req.db.product,
            as: "product",
          },
        },
        {
          model: req.db.clients,
          as: "clients",
        }
      ]
    })
  res.status(200).json({
    success: true,
    body: order,
  });
})

exports.removeOrderItem = asyncHandler(async (req, res, next) => {
  const { userId } = req;
  const { id } = req.params; // order_item ID

  if (!userId) {
    throw new MyError("Та эрхгүй байна", 400);
  }

  // 1. Хэрэглэгчийн basket төлөвтэй захиалгыг олох
  const order = await req.db.orders.findOne({
    where: { clientId: userId, status: "basket" },
  });

  if (!order) {
    throw new MyError("Таны сагс хоосон байна", 404);
  }

  // 2. Устгах order_item-г шалгах
  const orderItem = await req.db.order_items.findOne({
    where: { id, orderId: order.id },
  });

  if (!orderItem) {
    throw new MyError("Устгах бараа олдсонгүй", 404);
  }

  // 3. Устгах барааны үнийг хадгалах
  const removedItemPrice = orderItem.price * orderItem.quantity;

  // 4. Order item-ийг устгах
  await req.db.order_items.destroy({
    where: { id, orderId: order.id },
  });

  // 5. Order-ийн нийт үнийг шинэчлэх
  const newTotal = order.total_price - removedItemPrice;
  await order.update({ total_price: newTotal >= 0 ? newTotal : 0 });

  res.status(200).json({
    success: true,
    message: "Бараа сагснаас устгагдлаа",
  });
});

