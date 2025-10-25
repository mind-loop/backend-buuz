const asyncHandler = require("express-async-handler");
const paginate = require("../utils/paginate-sequelize");
const MyError = require("../utils/myError");
const bcrypt = require("bcrypt");
const { sendHtmlEmail } = require("../middleware/email");
exports.getUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  const sort = req.query.sort;
  let select = req.query.select;

  if (select) {
    select = select.split(" ");
  }

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, req.db.users);

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

  const users = await req.db.users.findAll(query);
  res.status(200).json({
    success: true,
    items: users,
    pagination,
  });
});

exports.signUp = asyncHandler(async (req, res, next) => {
  const user = await req.db.users.create({ ...req.body });
  if (!user) {
    throw new MyError("Бүртгэж чадсангүй");
  }
  const emailBody = {
    title: "Цахим меню систем",
    label: `Шинэ бүртгэл үүслээ`,
    email: req.body.email,
    from: "Системийн Админ",
    buttonText: "Систем рүү очих",
    buttonUrl: process.env.WEBSITE_URL,
    greeting: "Сайн байна уу?"
  };
  await sendHtmlEmail({ ...emailBody })
  res.status(200).json({
    message: "",
    body: { token: user.getJsonWebToken(), user: user },
  });
});

exports.signIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(email, password)
  if (!email || !password) {
    throw new MyError("Имейл эсвэл нууц үгээ оруулна уу", 400);
  }
  const user = await req.db.users.findOne({
    where: { email },
  });
  if (!user) {
    throw new MyError("Таны нэвтрэх нэр эсхүл нууц үг буруу байна", 400);
  }

  const ok = await user.CheckPass(password);
  if (!ok) {
    throw new MyError("Таны нэвтрэх нэр эсхүл нууц үг буруу байна", 400);
  }
  res.status(200).json({
    message: "",
    body: { token: user.getJsonWebToken(), user: user },
  });
});

exports.userInfo = asyncHandler(async (req, res, next) => {
  const { userId } = req;

  const user = await req.db.users.findOne({
    where: {
      id: userId
    }
  })
  if (!user) {
    throw new MyError("Та бүртгэлтэй эсэхээ шалгана уу", 401)
  }
  res.status(200).json({
    message: "Success (:",
    body: user,
  });
});

exports.updateUserInfo = asyncHandler(async (req, res, next) => {
  const { userId } = req;
  if (req.body.password) {
    delete req.body.password;
  }
  await req.db.users.update(
    req.body,
    { where: { id: userId }, fields: { exclude: ['password'] } }
  );
  res.status(200).json({
    message: "User updated.",
    body: { success: true },
  });
})

exports.removeUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;
  const user = await req.db.users.findByPk(userId);
  if (!user) {
    throw new MyError(`Таны устгах гэсэн ${userId} дугаартай хэрэглэгчийн мэдээлэл олдсонгүй`, 404)
  }
  await user.destroy();

  res.status(200).json({
    message: "User Deleted",
    body: { success: true },
  });
});

exports.changePassword = asyncHandler(async (req, res, next) => {
  const id = req.userId;
  if (!id) {
    throw new MyError("Id олдсонгүй!", 400);
  }
  const new_password = req.body.password;
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(new_password, salt);
  await req.db.users.update(
    { password },
    {
      where: {
        id,
      },
    }
  );
  const emailBody = {
    title: "Цахим меню систем",
    label: `Таны нууц үгээ шинэчлэгдлээ. 🎉`,
    email: req.email,
    from: "Системийн Админ",
    buttonText: "Систем рүү очих",
    buttonUrl: process.env.WEBSITE_URL,
    greeting: "Сайн байна уу?"
  };
  await sendHtmlEmail({ ...emailBody })
  res.status(200).json({
    message: "Таны нууц үг амжилттай шинэчлэгдлээ",
    body: { success: true },
  });
});