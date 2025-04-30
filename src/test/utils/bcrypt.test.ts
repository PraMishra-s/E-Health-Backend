import { compareValue, hashValue } from "../../common/utils/bcrypt";


describe('Bcrypt Utility Functions', () => {
  const plainText = 'my-secret-password';

  it('should hash and verify a value correctly', async () => {
    const hashed = await hashValue(plainText);
    const isMatch = await compareValue(plainText, hashed);
    expect(isMatch).toBe(true);
  });

  it('should fail verification for wrong password', async () => {
    const hashed = await hashValue(plainText);
    const isMatch = await compareValue('wrong-password', hashed);
    expect(isMatch).toBe(false);
  });
});
