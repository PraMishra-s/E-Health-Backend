"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("../../common/utils/uuid");
describe('UUID/OTP Utility Functions', () => {
    it('should generate a unique 25-character code', () => {
        const code = (0, uuid_1.generateUniqueCode)();
        expect(code).toHaveLength(25);
        expect(code).toMatch(/^[a-zA-Z0-9]+$/); // no dashes
    });
    it('should generate a 6-digit OTP', () => {
        const otp = (0, uuid_1.generateOTP)();
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
    });
});
