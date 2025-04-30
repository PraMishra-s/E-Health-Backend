"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = require("../../common/utils/jwt");
describe('JWT Utility Functions', () => {
    const payload = {
        userId: 'test-user-id',
        sessionId: 'test-session-id',
        userType: 'student',
    };
    it('should sign and verify an access token correctly', () => {
        const token = (0, jwt_1.signJwtToken)(payload, jwt_1.accessTokenSignOptions);
        const { payload: decoded, error } = (0, jwt_1.verifyJwtToken)(token, {
            secret: jwt_1.accessTokenSignOptions.secret,
        });
        expect(error).toBeUndefined();
        expect(decoded === null || decoded === void 0 ? void 0 : decoded.userId).toBe(payload.userId);
        expect(decoded === null || decoded === void 0 ? void 0 : decoded.sessionId).toBe(payload.sessionId);
        expect(decoded === null || decoded === void 0 ? void 0 : decoded.userType).toBe(payload.userType);
    });
    it('should return error for invalid token', () => {
        const { error } = (0, jwt_1.verifyJwtToken)('invalid.token');
        expect(error).toBeDefined();
    });
});
