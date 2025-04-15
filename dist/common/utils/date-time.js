"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateExpirationDate = exports.fortyFiveMinutesFromNow = exports.thirtyDaysFromNow = exports.tenMinutesAgo = exports.anHourFromNow = exports.threeMinutesAgo = exports.ONE_DAY_IN_MS = void 0;
const date_fns_1 = require("date-fns");
exports.ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const threeMinutesAgo = () => new Date(Date.now() - 3 * 60 * 1000);
exports.threeMinutesAgo = threeMinutesAgo;
const anHourFromNow = () => new Date(Date.now() + 60 * 60 * 1000);
exports.anHourFromNow = anHourFromNow;
const tenMinutesAgo = () => new Date(Date.now() - 10 * 60 * 1000);
exports.tenMinutesAgo = tenMinutesAgo;
const thirtyDaysFromNow = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
exports.thirtyDaysFromNow = thirtyDaysFromNow;
const fortyFiveMinutesFromNow = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 45);
    return now;
};
exports.fortyFiveMinutesFromNow = fortyFiveMinutesFromNow;
const calculateExpirationDate = (expiresIn = "15m") => {
    // Match number + unit (m = minutes, h = hours, d = days)
    const match = expiresIn.match(/^(\d+)([mhd])$/);
    if (!match)
        throw new Error('Invalid format. Use "15m", "1h", or "2d".');
    const [, value, unit] = match;
    const expirationDate = new Date();
    // Check the unit and apply accordingly
    switch (unit) {
        case "m": // minutes
            return (0, date_fns_1.add)(expirationDate, { minutes: parseInt(value) });
        case "h": // hours
            return (0, date_fns_1.add)(expirationDate, { hours: parseInt(value) });
        case "d": // days
            return (0, date_fns_1.add)(expirationDate, { days: parseInt(value) });
        default:
            throw new Error('Invalid unit. Use "m", "h", or "d".');
    }
};
exports.calculateExpirationDate = calculateExpirationDate;
