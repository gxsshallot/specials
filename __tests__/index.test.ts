import * as Specials from '../index';

const type = 'type';
const subtype = 'subtype';
const text = 'text';
const special = (state: any) => state;
const func = (param: any) => param;

function internal<S, P, R>(
    rootNode: Specials.Item<S, P, R>,
    path: Specials.Path
): Specials.Item<S, P, R> {
    const validPath = Specials.validPath(path);
    return validPath.reduce((prv, cur) => {
        if (prv && prv[Specials.CHILD_PART][cur]) {
            return prv[Specials.CHILD_PART][cur];
        } else {
            return Specials.generateNode<S, P, R>();
        }
    }, rootNode);
}

test('Register General', () => {
    const testFunc = function<S, P, R>(
        instance: Specials.Instance<S, P, R>,
        keys: Specials.Path,
        value: R
    ) {
        instance.registerDefault(keys, value);
        expect(internal(instance.getStorage(), keys)[Specials.DEFAULT_HANDLE]).toBe(value);
    };
    const textObj = Specials.getInstance<void, void, string>();
    testFunc(textObj, type, text);
    testFunc(textObj, [type], text);
    testFunc(textObj, [type, subtype], text);
    const funcObj = Specials.getInstance<void, void, typeof func>();
    testFunc(funcObj, type, func);
    testFunc(funcObj, [type], func);
    testFunc(funcObj, [type, subtype], func);
});

test('Register Special', () => {
    const testFunc = function<S, P, R>(
        instance: Specials.Instance<S, P, R>,
        keys: Specials.Path,
        value: Specials.HandleFunc<P, R>,
        index: number
    ) {
        const identifier = instance.registerSpecial(keys, special, value);
        expect(internal(instance.getStorage(), keys)[Specials.SPECIAL_PART][index])
            .toEqual({
                [Specials.kId]: identifier,
                [Specials.kSpecial]: special,
                [Specials.kHandle]: value,
                [Specials.kPriority]: Specials.PRIORITY.DEFAULT
            });
    };
    const textObj = Specials.getInstance<void, void, string>();
    testFunc(textObj, type, () => text, 0);
    testFunc(textObj, [type], () => text, 1);
    testFunc(textObj, [type, subtype], () => text, 0);
    const funcObj = Specials.getInstance<void, void, typeof func>();
    testFunc(funcObj, type, func, 0);
    testFunc(funcObj, [type], func, 1);
    testFunc(funcObj, [type, subtype], func, 0);
});

test('Get General', () => {
    const notExistKeys = [subtype, type, type];
    const testObj = function<S, P, R>(
        instance: Specials.Instance<S, P, R>,
        keys: Specials.Path,
        value: R
    ) {
        instance.registerDefault(keys, value);
        expect(instance.get(keys, undefined, undefined)).toBe(value);
        expect(instance.get(notExistKeys, undefined, undefined)).toBe(undefined);
        instance.unregister(keys);
    };
    const testFunc = function<S, R>(
        instance: Specials.Instance<S, number, R>,
        keys: Specials.Path,
        value: Specials.HandleFunc<number, R>
    ) {
        instance.registerDefault(keys, value);
        expect(instance.get(keys, undefined, 1)).toBe(1);
        expect(instance.get(notExistKeys, undefined, 2)).toBe(undefined);
        instance.unregister(keys);
    };
    const textObj = Specials.getInstance<void, void, string>();
    testObj(textObj, type, text);
    testObj(textObj, [type], text);
    testObj(textObj, [type, subtype], text);
    const funcObj = Specials.getInstance<void, number, number>();
    testFunc(funcObj, type, func);
    testFunc(funcObj, [type], func);
    testFunc(funcObj, [type, subtype], func);
});

test('Get Special', () => {
    const testFunc = function(
        instance: Specials.Instance<number, number, number>,
        keys: Specials.Path,
        value: Specials.HandleFunc<number, number>
    ) {
        const index = 1;
        const identifier = instance.registerSpecial(keys, state => state === index, value);
        expect(instance.get(keys, index, index * 10)).toBe(value(index * 10));
        expect(instance.get(keys, index * 100, index * 10)).toBe(undefined);
        instance.unregister(keys, identifier);
    };
    const obj = Specials.getInstance<number, number, number>();
    testFunc(obj, type, func);
    testFunc(obj, [type], func);
    testFunc(obj, [type, subtype], func);
});

test('Get Special With Priority', () => {
    const highFunc = (param?: number) => {
        if (param) {
            return param * 100;
        } else {
            return undefined;
        }
    };
    const testFunc = function(
        instance: Specials.Instance<number, number, number>,
        keys: Specials.Path,
        value: Specials.HandleFunc<number, number>,
        highValue: Specials.HandleFunc<number, number>
    ) {
        const index = 1;
        const lowId = instance.registerSpecial(keys, state => state === index, value);
        const highId = instance.registerSpecial(keys, state => state === index, highValue, Specials.PRIORITY.HIGH);
        expect(instance.get(keys, index, index * 10)).toBe(highValue(index * 10));
        expect(instance.get(keys, index * 100, index * 10)).toBe(undefined);
        instance.unregister(keys, lowId);
        instance.unregister(keys, highId);
    };
    const obj = Specials.getInstance<number, number, number>();
    testFunc(obj, type, func, highFunc);
    testFunc(obj, [type], func, highFunc);
    testFunc(obj, [type, subtype], func, highFunc);
});

test('Unregister General', () => {
    const unregisterFunc = function<S, P, R>(
        instance: Specials.Instance<S, P, R>,
        keys: Specials.Path,
        answer: boolean = true
    ) {
        const result = instance.unregister(keys, undefined);
        expect(result).toBe(answer);
    };
    const testFunc = function<S, P, R>(
        instance: Specials.Instance<S, P, R>,
        keys: Specials.Path,
        value: R
    ) {
        instance.registerDefault(keys, value);
        unregisterFunc(instance, keys);
        expect(internal(instance.getStorage(), keys)[Specials.DEFAULT_HANDLE]).toBe(undefined);
    };
    const textObj = Specials.getInstance<void, void, string>();
    testFunc(textObj, type, text);
    testFunc(textObj, [type], text);
    testFunc(textObj, [type, subtype], text);
    const funcObj = Specials.getInstance<void, void, typeof func>();
    testFunc(funcObj, type, func);
    testFunc(funcObj, [type], func);
    testFunc(funcObj, [type, subtype], func);
});

test('Unregister Special', () => {
    const unregisterFunc = function<S, P, R>(
        instance: Specials.Instance<S, P, R>,
        keys: Specials.Path,
        identifier: number,
        answer: boolean = true
    ) {
        const result = instance.unregister(keys, identifier);
        expect(result).toBe(answer);
    };
    const testFunc = function<S, P, R>(
        instance: Specials.Instance<S, P, R>,
        keys: Specials.Path,
        value: Specials.HandleFunc<P, R>
    ) {
        const identifier = instance.registerSpecial(keys, special, value);
        unregisterFunc(instance, keys, identifier);
        expect(internal(instance.getStorage(), keys)[Specials.SPECIAL_PART].length).toBe(0);
    };
    const textObj = Specials.getInstance<void, void, string>();
    testFunc(textObj, type, () => text);
    testFunc(textObj, [type], () => text);
    testFunc(textObj, [type, subtype], () => text);
    const funcObj = Specials.getInstance<void, void, typeof func>();
    testFunc(funcObj, type, func);
    testFunc(funcObj, [type], func);
    testFunc(funcObj, [type, subtype], func);
});