export const DEFAULT_HANDLE = '__default__';
export const SPECIAL_PART = '__special__';
export const CHILD_PART = '__child__';

export const kId = 'id';
export const kSpecial = 'special';
export const kHandle = 'handle';
export const kPriority = 'priority';

export const PRIORITY = {
    LOW: -255,
    DEFAULT: 0,
    HIGH: 255,
};

export type PathKey = string | number | void | null;
export type Path = PathKey | PathKey[];
export type StateFunc<S> = (state?: S) => boolean;
export type HandleResult<R> = R | void;
export type HandleFunc<P, R> = (params?: P) => HandleResult<R>;
export type HandleId = number;

export interface Special<S, P, R> {
    id: HandleId;
    special: StateFunc<S>;
    handle: HandleFunc<P, R>;
    priority: number;
}

export interface Item<S, P, R> {
    [DEFAULT_HANDLE]?: R;
    [SPECIAL_PART]: Special<S, P, R>[];
    [CHILD_PART]: {
        [key: string]: Item<S, P, R>;
    };
}

export type Root<S, P, R> = Item<S, P, R>;

export interface Instance<S, P, R> {
    getStorage: () => Root<S, P, R>;
    clearStorage: () => void;
    get: (path: Path, state?: S, params?: P) => HandleResult<R>;
    registerDefault: (path: Path, handle: R) => void;
    registerSpecial: (path: Path, special: StateFunc<S>, handle: HandleFunc<P, R>, priority?: number) => HandleId;
    unregister: (path: Path, handleId?: HandleId) => boolean;
}

export function getInstance<S, P, R>() {
    const root: Root<S, P, R> = generateNode();
    return {
        getStorage: function () {
            return root;
        },
        clearStorage: function () {
            delete root[DEFAULT_HANDLE];
            root[SPECIAL_PART] = [];
            root[CHILD_PART] = {};
        },
        get: function (path: Path, state?: S, params?: P) {
            return get(root, path, state, params);
        },
        registerDefault: function (path: Path, handle: R) {
            return registerDefault(root, path, handle);
        },
        registerSpecial: function (path: Path, special: StateFunc<S>, handle: HandleFunc<P, R>, priority: number = PRIORITY.DEFAULT) {
            return registerSpecial(root, path, special, handle, priority);
        },
        unregister: function (path: Path, handleId?: HandleId) {
            return unregister(root, path, handleId);
        },
    };
}

export function validPath(path: Path): string[] {
    const paths = Array.isArray(path) ? path : [path];
    const validPath: string[] = [];
    paths.forEach(function (i) {
        if (i && i !== DEFAULT_HANDLE) {
            validPath.push(String(i));
        }
    });
    return validPath;
}

export function generateNode<S, P, R>(): Item<S, P, R> {
    return {
        [SPECIAL_PART]: [],
        [CHILD_PART]: {},
    };
}

/**
 * Find handle in root object with path.
 * If it does not exist, get the default handle in current or above level.
 */
function get<S, P, R>(
    obj: Root<S, P, R>,
    path: Path,
    state?: S,
    params?: P
): HandleResult<R> {
    const paths = validPath(path);
    const items = [obj];
    paths.reduce((prv, cur) => {
        if (!prv) {
            return prv;
        } else {
            prv[CHILD_PART][cur] && items.push(prv[CHILD_PART][cur]);
            return prv[CHILD_PART][cur];
        }
    }, obj);
    // Special Check
    for (let i = items.length - 1; i >= 0; i--) {
        const specs = items[i][SPECIAL_PART].filter(cur => cur[kSpecial](state));
        if (specs.length > 0) {
            const result = specs.reduce((prv, cur) => prv[kPriority] < cur[kPriority] ? cur : prv);
            return result[kHandle](params);
        }
    }
    // Regular Check
    for (let i = items.length - 1; i >= 0; i--) {
        if (items[i][DEFAULT_HANDLE]) {
            return items[i][DEFAULT_HANDLE];
        }
    }
}

/**
 * Register a default handle in root object.
 */
function registerDefault<S, P, R>(
    obj: Root<S, P, R>,
    path: Path,
    handle: R
): void {
    const paths = validPath(path);
    const item = paths.reduce((prv, cur) => {
        if (!prv[CHILD_PART][cur]) {
            prv[CHILD_PART][cur] = generateNode();
        }
        return prv[CHILD_PART][cur];
    }, obj);
    item[DEFAULT_HANDLE] = handle;
}

/**
 * Register a special handle in root object.
 */
function registerSpecial<S, P, R>(
    obj: Root<S, P, R>,
    path: Path,
    special: StateFunc<S>,
    handle: HandleFunc<P, R>,
    priority: number
): HandleId {
    const paths = validPath(path);
    const item = paths.reduce((prv, cur) => {
        if (!prv[CHILD_PART][cur]) {
            prv[CHILD_PART][cur] = generateNode();
        }
        return prv[CHILD_PART][cur];
    }, obj);
    const arr = item[SPECIAL_PART];
    const handleId = arr.length === 0 ? 1 : arr[arr.length - 1][kId] + 1;
    arr.push({
        [kId]: handleId,
        [kSpecial]: special,
        [kHandle]: handle,
        [kPriority]: priority,
    });
    return handleId;
}

/**
 * Unregister a handle in root object.
 */
function unregister<S, P, R>(
    obj: Root<S, P, R>,
    path: Path,
    handleId?: HandleId
): boolean {
    const paths = validPath(path);
    const item = paths.reduce((prv, cur) => prv[CHILD_PART][cur] || generateNode(), obj);
    if (handleId) {
        const len = item[SPECIAL_PART].length;
        item[SPECIAL_PART] = item[SPECIAL_PART]
            .filter(cur => cur[kId] !== handleId);
        return item[SPECIAL_PART].length !== len;
    } else {
        if (item[DEFAULT_HANDLE]) {
            delete item[DEFAULT_HANDLE];
            return true;
        } else {
            return false;
        }
    }
}