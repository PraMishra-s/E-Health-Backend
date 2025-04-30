import { accessTokenSignOptions, signJwtToken, verifyJwtToken } from "../../common/utils/jwt";


describe('JWT Utility Functions', () => {
  const payload = {
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    userType: 'student',
  };

  it('should sign and verify an access token correctly', () => {
    const token = signJwtToken(payload, accessTokenSignOptions);
    const { payload: decoded, error } = verifyJwtToken(token, {
      secret: accessTokenSignOptions.secret,
    });

    expect(error).toBeUndefined();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.sessionId).toBe(payload.sessionId);
    expect(decoded?.userType).toBe(payload.userType);
  });

  it('should return error for invalid token', () => {
    const { error } = verifyJwtToken('invalid.token');
    expect(error).toBeDefined();
  });
});
