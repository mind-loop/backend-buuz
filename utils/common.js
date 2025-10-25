const dayjs = require("dayjs");
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { PaymentSell } = require("./constants");

dayjs.extend(utc);
dayjs.extend(timezone);

exports.generateLengthPass = (len) => {
    const number = Math.pow(10, len);
    return Math.floor((Math.random() * 9 * number) / 10) + number / 10 + "";
  };

  exports.generateLengthDate = (days) => {
    const futureDate = dayjs().add(days, 'day').tz("Asia/Ulaanbaatar").startOf("day");
    return futureDate.format("YYYY-MM-DD HH:mm:ss");
  };

exports.generatePayment=(days,price)=>{
  const sell=PaymentSell.find(sell=>sell.exp_day==days)
  const amount =sell?price-price*sell.process/100:price
  return {sell:sell.process,amount}
}

