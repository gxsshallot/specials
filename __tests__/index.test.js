import * as Special from '../index';

const type = 'type';
const subtype = 'subtype';
const text = 'text';
const special = (state) => state;
const func = (param) => param;

function internal(rootNode, key, other = undefined) {
    const keys = Array.isArray(key) ? key : [key];
    if (other) {
        keys.push(other);
    }
    return [rootNode, ...keys].reduce((prv, cur) => {
        if (prv && Object.prototype.isPrototypeOf(prv) && prv.hasOwnProperty(cur)) {
            return prv[cur];
        } else {
            return undefined;
        }
    });
}

test('Register General', () => {
    const rootNode = {};
    const testFunc = (keys, value) => {
        Special.register(rootNode, keys, undefined, value);
        expect(internal(rootNode, keys, Special.DEFAULT_HANDLE)).toBe(value);
    };
    testFunc(type, text);
    testFunc([type], text);
    testFunc([type, subtype], text);
    testFunc(type, func);
    testFunc([type], func);
    testFunc([type, subtype], func);
});

test('Register Special', () => {
    const rootNode = {};
    let index = 0;
    const testFunc = (keys, value) => {
        const identifier = Special.register(rootNode, keys, special, value);
        expect(internal(rootNode, Array.isArray(keys) ? keys[0] : keys, Special.SPECIAL_PART)[index])
            .toEqual({
                [Special.kId]: identifier,
                [Special.kSpecial]: special,
                [Special.kHandle]: value,
                [Special.kPriority]: Special.PRIORITY.DEFAULT
            });
        index++;
    };
    testFunc(type, text);
    testFunc([type], text);
    testFunc([type, subtype], text);
    testFunc(type, func);
    testFunc([type], func);
    testFunc([type, subtype], func);
});

test('Get General', () => {
    const rootNode = {};
    const notExistKeys = [type, subtype, type];
    const testFunc = (keys, value) => {
        Special.register(rootNode, keys, undefined, value);
        expect(Special.get(rootNode, keys, undefined, undefined)).toBe(value);
        expect(Special.get(rootNode, notExistKeys, undefined, undefined)).toBe(value);
        Special.unregister(rootNode, keys, undefined);
    };
    testFunc(type, text);
    testFunc([type], text);
    testFunc([type, subtype], text);
    testFunc(type, func);
    testFunc([type], func);
    testFunc([type, subtype], func);
});

test('Get Special', () => {
    const rootNode = {};
    const testFunc = (keys, value) => {
        const isFunc = typeof value === 'function';
        const index = 1;
        const identifier = Special.register(rootNode, keys, state => state === index, value);
        expect(Special.get(rootNode, keys, index, undefined)).toBe(value);
        expect(Special.get(rootNode, keys, index, index * 10)).toBe(isFunc ? value(index * 10) : value);
        expect(Special.get(rootNode, keys, index * 100, index * 10)).toBe(undefined);
        Special.unregister(rootNode, keys, identifier);
    };
    testFunc(type, text);
    testFunc([type], text);
    testFunc([type, subtype], text);
    testFunc(type, func);
    testFunc([type], func);
    testFunc([type, subtype], func);
});

test('Get Special With Priority', () => {
    const rootNode = {};
    const highText = text + text;
    const highFunc = (param) => param * 100;
    const testFunc = (keys, value, highValue) => {
        const isFunc = typeof value === 'function' && typeof highValue === 'function';
        const index = 1;
        const lowId = Special.register(rootNode, keys, state => state === index, value);
        const highId = Special.register(rootNode, keys, state => state === index, highValue, Special.PRIORITY.HIGH);
        expect(Special.get(rootNode, keys, index, undefined)).toBe(highValue);
        expect(Special.get(rootNode, keys, index, index * 10)).toBe(isFunc ? highValue(index * 10) : highValue);
        expect(Special.get(rootNode, keys, index * 100, index * 10)).toBe(undefined);
        Special.unregister(rootNode, keys, lowId);
        Special.unregister(rootNode, keys, highId);
    };
    testFunc(type, text, highText);
    testFunc([type], text, highText);
    testFunc([type, subtype], text, highText);
    testFunc(type, func, highFunc);
    testFunc([type], func, highFunc);
    testFunc([type, subtype], func, highFunc);
});

test('Unregister General', () => {
    const rootNode = {};
    const unregisterFunc = (keys, answer = true) => {
        const result = Special.unregister(rootNode, keys, undefined);
        expect(result).toBe(answer);
    };
    const testFunc = (keys, value) => {
        Special.register(rootNode, keys, undefined, value);
        unregisterFunc(keys);
        expect(internal(rootNode, keys, Special.DEFAULT_HANDLE)).toBe(undefined);
    };
    testFunc(type, text);
    testFunc([type], text);
    testFunc([type, subtype], text);
    testFunc(type, func);
    testFunc([type], func);
    testFunc([type, subtype], func);
    unregisterFunc([type], false);
    unregisterFunc([type, subtype], false);
    unregisterFunc([type, subtype, type], false);
});

test('Unregister Special', () => {
    const rootNode = {};
    const unregisterFunc = (keys, identifier, answer = true) => {
        const result = Special.unregister(rootNode, keys, identifier);
        expect(result).toBe(answer);
    };
    const testFunc = (keys, value) => {
        const identifier = Special.register(rootNode, keys, special, value);
        unregisterFunc(keys, identifier);
        expect(internal(rootNode, Array.isArray(keys) ? keys[0] : keys, Special.SPECIAL_PART).length).toBe(0);
    };
    const identifier = '1234567890';
    testFunc(type ,text);
    testFunc([type], text);
    testFunc([type, subtype], text);
    testFunc(type, func);
    testFunc([type], func);
    testFunc([type, subtype], func);
    unregisterFunc([type], identifier, false);
    unregisterFunc([type, subtype], identifier, false);
    unregisterFunc([subtype], identifier, false);
    unregisterFunc([subtype, type], identifier, false);
});