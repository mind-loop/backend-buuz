const asyncHandler = require("express-async-handler");
const paginate = require("../utils/paginate-sequelize");
const MyError = require("../utils/myError");
const bcrypt = require("bcrypt");
const { sendHtmlEmail } = require("../middleware/email");
const { generateLengthPass } = require("../utils/common");

// =====================
//  Бүх харилцагч жагсаах
// =====================
exports.getClients = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const sort = req.query.sort;
  let select = req.query.select;

  if (select) select = select.split(" ");
  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, req.db.clients);
  let query = { offset: pagination.start - 1, limit };

  if (req.query) query.where = req.query;
  if (select) query.attributes = select;
  if (sort) {
    query.order = sort.split(" ").map((el) => [
      el.charAt(0) === "-" ? el.substring(1) : el,
      el.charAt(0) === "-" ? "DESC" : "ASC",
    ]);
  }

  const clients = await req.db.clients.findAll(query);
  res.status(200).json({
    success: true,
    body: {
      items: clients,
      pagination
    },
  });
});
exports.getClient = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const clients = await req.db.clients.findByPk(id,{
      include: [{
      model: req.db.orders,
      as: "orders",
      // include: {
      //   model: req.db.order,
      //   as: "product",
      // },
    }]
    });
    if (!clients) {
        throw new MyError(`${id}  дугаартай бүтээгдэхүүн олдсонгүй`, 404)
    }
    res.status(200).json({
        success: true,
        body: clients,
    });
});
// =====================
//  Бүртгүүлэх (Sign Up)
// =====================
exports.signUp = asyncHandler(async (req, res, next) => {
  const client = await req.db.clients.create({ ...req.body });
  if (!client) throw new MyError("Бүртгэл амжилтгүй боллоо", 400);

  const emailBody = {
    title: "Бууз захиалгын систем",
    label: `Таны бүртгэл амжилттай үүслээ 👏`,
    email: req.body.email,
    from: "Системийн Админ",
    buttonText: "Систем рүү нэвтрэх",
    buttonUrl: process.env.WEBSITE_URL,
    greeting: "Сайн байна уу?",
  };
  await sendHtmlEmail({ ...emailBody });

  res.status(200).json({
    message: "Амжилттай бүртгэгдлээ.",
    body: { token: client.getJsonWebToken(), client },
  });
});

// =====================
//  Нэвтрэх (Sign In)
// =====================
exports.signIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    throw new MyError("Имэйл болон нууц үгээ оруулна уу", 400);

  const client = await req.db.clients.findOne({ where: { email } });
  if (!client) throw new MyError("Имэйл буруу байна", 400);

  const ok = await client.CheckPass(password);
  if (!ok) throw new MyError("Имэйл эсвэл нууц үг буруу байна", 400);

  res.status(200).json({
    message: "Амжилттай нэвтэрлээ",
    body: { token: client.getJsonWebToken(), client },
  });
});

// =====================
//  Хэрэглэгчийн мэдээлэл
// =====================
exports.clientInfo = asyncHandler(async (req, res, next) => {
  const { userId } = req;
  const client = await req.db.clients.findByPk(userId);
  if (!client) throw new MyError("Таны бүртгэл олдсонгүй", 404);

  res.status(200).json({
    message: "Success",
    body: client,
  });
});

// =====================
//  Хэрэглэгчийн мэдээлэл шинэчлэх
// =====================
exports.updateClientInfo = asyncHandler(async (req, res, next) => {
  const { userId } = req;
  if (req.body.password) delete req.body.password;

  await req.db.clients.update(req.body, { where: { id: userId } });

  res.status(200).json({
    message: "Таны мэдээлэл шинэчлэгдлээ.",
    body: { success: true },
  });
});

// =====================
//  Хэрэглэгч устгах
// =====================
exports.removeClient = asyncHandler(async (req, res, next) => {
  const clientId = req.params.id;
  const client = await req.db.clients.findByPk(clientId);
  if (!client)
    throw new MyError(`ID ${clientId} дугаартай хэрэглэгч олдсонгүй`, 404);

  await client.destroy();

  res.status(200).json({
    message: "Хэрэглэгч устгагдлаа.",
    body: { success: true },
  });
});

// =====================
//  Нууц үг солих
// =====================
exports.changePassword = asyncHandler(async (req, res, next) => {
  const id = req.userId;
  if (!id) throw new MyError("ID олдсонгүй", 400);

  const newPassword = req.body.password;
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(newPassword, salt);

  await req.db.clients.update({ password: hashed }, { where: { id } });

  const emailBody = {
    title: "Бууз захиалгын систем",
    label: `Таны нууц үг амжилттай шинэчлэгдлээ 🔐`,
    email: req.email,
    from: "Системийн Админ",
    buttonText: "Систем рүү очих",
    buttonUrl: process.env.WEBSITE_URL,
    greeting: "Сайн байна уу?",
  };
  await sendHtmlEmail({ ...emailBody });

  res.status(200).json({
    message: "Таны нууц үг амжилттай шинэчлэгдлээ",
    body: { success: true },
  });
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const password = generateLengthPass(8)
  if (!email) {
    throw new MyError(`Бүртгэлгүй байна!`, 400);
  }
  const users = await req.db.clients.findOne({
    where: {
      email,
    },
  });
  if (!users) {
    throw new MyError(`${email} хэрэглэгч олдсонгүй!`, 400);
  }
  const salt = await bcrypt.genSalt(10);
  const new_password = await bcrypt.hash(password, salt);
  const emailBody = {
    title: "Бууз захиалгын систем",
    label: `Таны нууц үгээ сэргээлээ. 🎉 Нууц үг:${password}`,
    email: req.body.email,
    from: "Системийн Админ",
    buttonText: "Систем рүү очих",
    buttonUrl: process.env.WEBSITE_URL,
    greeting: "Сайн байна уу?"
  };
  await sendHtmlEmail({ ...emailBody })

  await req.db.clients.update(
    { password: new_password },
    {
      where: {
        email,
      },
    }
  );
  res.status(200).json({
    message: "Таны нууц үг амжилттай сэргээгдлээ. Та бүртгэлтэй имейл хаягаараа нууц үгээ авна уу.",
    body: { success: true },
  });
});