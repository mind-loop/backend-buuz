import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";


dayjs.extend(utc);
dayjs.extend(timezone);

export const generateLengthPass = (len) => {
    const number = Math.pow(10, len);
    return Math.floor((Math.random() * 9 * number) / 10) + number / 10 + "";
  };

  export const generateLengthDate = (days) => {
    const futureDate = dayjs().add(days, 'day').tz("Asia/Ulaanbaatar").startOf("day");
    return futureDate.format("YYYY-MM-DD HH:mm:ss");
  };


