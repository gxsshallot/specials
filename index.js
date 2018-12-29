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
    const paths = getPaths(path);
    const items = [obj];
    paths.reduce((prv, cur) => {
        if (!prv) {
            return prv;
        } else {
            prv[cur] && items.push(prv[cur]);
            return prv[cur];
        }
    }, obj);
    // Special Check
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (item[SPECIAL_PART] && item[SPECIAL_PART].length > 0) {
            const specs = item[SPECIAL_PART]
                .filter(cur => cur[kSpecial](state));
            if (specs.length > 0) {
                const result = specs.reduce((prv, cur) => prv[kPriority] < cur[kPriority] ? cur : prv);
                return handleItem(result[kHandle], params);
            }
        }
    }
    // Regular Check
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (item[DEFAULT_HANDLE]) {
            return handleItem(item[DEFAULT_HANDLE], params);
        }
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
    const paths = getPaths(path);
    const item = paths.reduce((prv, cur) => {
        if (!prv[cur]) {
            prv[cur] = {};
        }
        return prv[cur];
    }, obj);
    if (special) {
        if (!item[SPECIAL_PART]) {
            item[SPECIAL_PART] = [];
        }
        const arr = item[SPECIAL_PART];
        const handleId = arr.length === 0 ? 1 : arr[arr.length - 1][kId] + 1;
        arr.push({
            [kId]: handleId,
            [kSpecial]: special,
            [kHandle]: handle,
            [kPriority]: priority,
        });
        return handleId;
    } else {
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
    const paths = getPaths(path);
    const item = paths.reduce((prv, cur) => prv[cur] || {}, obj);
    if (handleId) {
        if (item[SPECIAL_PART]) {
            const len = item[SPECIAL_PART].length;
            item[SPECIAL_PART] = item[SPECIAL_PART]
                .filter(cur => cur[kId] !== handleId);
            return item[SPECIAL_PART].length !== len;
        } else {
            return false;
        }
    } else {
        if (item[DEFAULT_HANDLE]) {
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

function getPaths(path) {
    const paths = Array.isArray(path) ? path : [path];
    return paths.filter(item => {
        return (
            item !== undefined && 
            item !== null && 
            item !== DEFAULT_HANDLE && 
            item !== SPECIAL_PART
        );
    });
}