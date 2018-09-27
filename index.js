export const DEFAULT_HANDLE = '__default__';
export const SPECIAL_PART = 'special';
export const COUNT_PART = 'count';

const kId = 'id';
const kSpecial = 'special';
const kHandle = 'handle';

/**
 * Find handle in root object with path.
 * If it does not exist, get the default handle in current or above level.
 * @param obj Root object.
 * @param path Tree path, a string or an array of string.
 * @param state Current state for special judging.
 * @param params Handle params.
 * @returns {*} Handle result.
 */
export function get(obj, path, state, params) {
    const keyPath = getKeyPath(path);
    const keyItem = obj[keyPath];
    if (keyItem && keyItem[SPECIAL_PART] && keyItem[SPECIAL_PART].length > 0) {
        const specs = keyItem[SPECIAL_PART]
            .filter(specItem => specItem[kSpecial](state));
        if (specs.length > 0) {
            return handleItem(specs[0][kHandle], params);
        }
    }
    let result = obj[DEFAULT_HANDLE];
    getPaths(path)
        .reduce((prv, cur) => {
            if (!prv) {
                return prv;
            } else {
                if (prv[cur]) {
                    const defaultItem = prv[cur][DEFAULT_HANDLE];
                    if (defaultItem) {
                        result = defaultItem;
                    }
                    return prv[cur];
                } else {
                    const defaultItem = prv[DEFAULT_HANDLE];
                    if (defaultItem) {
                        result = defaultItem;
                    }
                    return undefined;
                }
            }
        }, obj);
    if (typeof result !== 'undefined') {
        return handleItem(result, params);
    } else {
        return result;
    }
}

/**
 * Register a handle in root object.
 * @param obj Root object.
 * @param path Tree path, a string or an array of string.
 * @param specialFunc Special judging function.
 * @param handle Handle.
 * @returns {*} Return handle identifier for unregister if it has special judging function.
 */
export function register(obj, path, specialFunc, handle) {
    if (specialFunc) {
        const keyPath = getKeyPath(path);
        if (!obj[keyPath]) {
            obj[keyPath] = {};
        }
        const handleId = (obj[keyPath][COUNT_PART] || 0) + 1;
        const value = {
            [kId]: handleId,
            [kSpecial]: specialFunc,
            [kHandle]: handle,
        };
        if (obj[keyPath][SPECIAL_PART]) {
            obj[keyPath][SPECIAL_PART].push(value);
        } else {
            obj[keyPath][SPECIAL_PART] = [value];
        }
        obj[keyPath][COUNT_PART] = handleId;
        return handleId;
    } else {
        const item = getPaths(path)
            .filter(item => item !== DEFAULT_HANDLE)
            .reduce((prv, cur) => {
                if (!prv[cur]) {
                    prv[cur] = {};
                }
                return prv[cur];
            }, obj);
        item[DEFAULT_HANDLE] = handle;
    }
}

/**
 * Unregister a handle in root object.
 * @param obj Root object.
 * @param path Tree path, a string or an array of string.
 * @param handleId Handle identifier. Unregister general handle if it is not passed.
 * @returns {boolean} Success or failure.
 */
export function unregister(obj, path, handleId) {
    if (handleId) {
        const keyPath = getKeyPath(path);
        const item = obj[keyPath];
        if (!item || !item[SPECIAL_PART]) {
            return false;
        } else {
            const len = item[SPECIAL_PART].length;
            item[SPECIAL_PART] = item[SPECIAL_PART]
                .filter(specItem => specItem[kId] !== handleId);
            return item[SPECIAL_PART].length !== len;
        }
    } else {
        const paths = getPaths(path);
        if (paths.length >= 1) {
            if (obj[paths[0]]) {
                return unregister(obj[paths[0]], paths.slice(1, paths.length), undefined);
            } else {
                return false;
            }
        } else {
            if (obj.hasOwnProperty(DEFAULT_HANDLE)) {
                delete obj[DEFAULT_HANDLE];
                return true;
            } else {
                return false;
            }
        }
    }
}

function handleItem(handle, params) {
    if (typeof finalFunc === 'function') {
        if (!params) {
            return handle;
        } else {
            return handle(params);
        }
    } else {
        return handle;
    }
}

function getKeyPath(path) {
    return Array.isArray(path) ? path[0] : path;
}

function getPaths(path) {
    const paths = Array.isArray(path) ? path : [path];
    return paths.filter(item => item !== undefined && item !== null);
}