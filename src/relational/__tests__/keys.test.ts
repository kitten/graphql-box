import { genId, gen2DKey, gen3DKey, rangeOfKey, idOfKey, fieldOfKey } from '../keys';

describe('level/keys', () => {
  describe('genId', () => {
    it('works', () => {
      const id = genId();
      expect(id.charAt(0)).toBe('c');
      expect(id.length).toBe(25);
    });
  });

  describe('gen2DKey', () => {
    it('works', () => {
      expect(gen2DKey('first', 'second')).toMatchInlineSnapshot(`"first!second"`);
    });
  });

  describe('gen3DKey', () => {
    it('works', () => {
      expect(gen3DKey('first', 'second', 'third')).toMatchInlineSnapshot(`"first!second!third"`);
    });
  });

  describe('rangeOfKey', () => {
    it('works', () => {
      expect(rangeOfKey('test')).toEqual({
        gt: 'test!',
        lt: 'test!\xff',
      });
    });
  });

  describe('idOfKey', () => {
    it('works', () => {
      const name = 'Hello';
      const id = '1234567890123456789012345';
      const key = 'Hello!' + id + '!test';
      expect(idOfKey(name, key)).toBe(id);
    });
  });

  describe('fieldOfKey', () => {
    it('works', () => {
      const name = 'Hello';
      const key = 'Hello!1234567890123456789012345!test';
      expect(fieldOfKey(name, key)).toBe('test');
    });
  });
});
