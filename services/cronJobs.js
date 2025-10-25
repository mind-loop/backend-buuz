const { Op } = require("sequelize");
function adjustToUTCPlus8(date) {
    const currentTime = date.getTime();
    const timeInUTCPlus8 = currentTime + (8 * 60 * 60 * 1000);
    date.setTime(timeInUTCPlus8);
    return date;
}

async function expiredCheckDepartments({ db }) {
    try {
        const date = new Date();
        const now = adjustToUTCPlus8(date);
        await db.department.update(
            { ispaid: 0 }, // Хугацаа дууссан бол статусыг өөрчлөх
            { where: { expired_date: { [Op.lt]: now } } } // expired_date нь одоогийнхоос бага байвал
        );
        console.log("⏳ Хугацаа дууссан департментүүдийг шинэчлэв.");
    } catch (error) {
        console.error("❌ expiredCheckDepartments алдаа:", error);
    }
}
module.exports = { expiredCheckDepartments };