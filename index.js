export const DEFAULT_HANDLE = '__default__';
export const SPECIAL_PART = 'special';

export const kId = 'id';
export const kSpecial = 'special';
export const kHandle = 'handle';
export const kPriority = 'priority';

export const PRIORITY = {
    LOW: -255,
    DEFAULT: 0,
    HIGH: 255,
};

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
            const item = specs.reduce((prv, cur) => {
                if (prv[kPriority] < cur[kPriority]) {
                    return cur;
                } else {
                    return prv;
                }
            });
            return handleItem(item[kHandle], params);
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
 * @param special Special judging function.
 * @param handle Handle.
 * @returns {*} Return handle identifier for unregister if it has special judging function.
 */
export function register(obj, path, special, handle, priority = PRIORITY.DEFAULT) {
    if (special) {
        const keyPath = getKeyPath(path);
        if (!obj[keyPath]) {
            obj[keyPath] = {};
        }
        const keyItem = obj[keyPath];
        if (!keyItem[SPECIAL_PART]) {
            keyItem[SPECIAL_PART] = [];
        }
        const handleId = keyItem[SPECIAL_PART].length === 0 ? 1 :
            keyItem[SPECIAL_PART][keyItem[SPECIAL_PART].length - 1][kId] + 1;
        keyItem[SPECIAL_PART].push({
            [kId]: handleId,
            [kSpecial]: special,
            [kHandle]: handle,
            [kPriority]: priority,
        });
        return handleId;
    } else {
        const item = getPaths(path)
            .filter(pathItem => pathItem !== DEFAULT_HANDLE)
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
        const keyItem = obj[keyPath];
        if (!keyItem || !keyItem[SPECIAL_PART]) {
            return false;
        } else {
            const len = keyItem[SPECIAL_PART].length;
            keyItem[SPECIAL_PART] = keyItem[SPECIAL_PART]
                .filter(item => item[kId] !== handleId);
            return keyItem[SPECIAL_PART].length !== len;
        }
    } else {
        const paths = getPaths(path);
        const item = paths.reduce((prv, cur) => {
            if (prv[cur]) {
                return prv[cur];
            } else {
                return {};
            }
        }, obj);
        if (item.hasOwnProperty(DEFAULT_HANDLE)) {
            delete item[DEFAULT_HANDLE];
            return true;
        } else {
            return false;
        }
    }
}

function handleItem(handle, params) {
    if (typeof handle === 'function') {
        if (params === undefined || params === null) {
            return handle;
        } else {
            return handle(params);
        }
    } else {
        return handle;
    }
}

function getKeyPath(path) {
    return getPaths(path)[0];
}

function getPaths(path) {
    const paths = Array.isArray(path) ? path : [path];
    const validPaths = paths.filter(item => item !== undefined && item !== null);
    if (validPaths.length <= 0) {
        console.error('Path ' + JSON.stringify(path) + ' is not valid');
    }
    return validPaths;
}