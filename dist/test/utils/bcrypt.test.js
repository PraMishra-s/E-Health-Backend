"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = require("../../common/utils/bcrypt");
describe('Bcrypt Utility Functions', () => {
    const plainText = 'my-secret-password';
    it('should hash and verify a value correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const hashed = yield (0, bcrypt_1.hashValue)(plainText);
        const isMatch = yield (0, bcrypt_1.compareValue)(plainText, hashed);
        expect(isMatch).toBe(true);
    }));
    it('should fail verification for wrong password', () => __awaiter(void 0, void 0, void 0, function* () {
        const hashed = yield (0, bcrypt_1.hashValue)(plainText);
        const isMatch = yield (0, bcrypt_1.compareValue)('wrong-password', hashed);
        expect(isMatch).toBe(false);
    }));
});
