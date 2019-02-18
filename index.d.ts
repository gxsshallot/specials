export const DEFAULT_HANDLE: string;
export const SPECIAL_PART: string;

export const kId: string;
export const kSpecial: string;
export const kHandle: string;
export const kPriority: string;

export const PRIORITY: {
    LOW: number;
    DEFAULT: number;
    HIGH: number;
};

export interface RootType {
    [key: string]: any;
}

type Path = string | number | void;

export type PathType = Path | Path[];

/**
 * Find handle in root object with path.
 * If it does not exist, get the default handle in current or above level.
 */
export function get(
    obj: RootType,
    path: PathType,
    state?: any,
    params?: any
): any;

/**
 * Register a handle in root object.
 */
export function register(
    obj: RootType,
    path: PathType,
    special?: (state?: any) => boolean,
    handle?: any,
    priority?: number
): string | void;

/**
 * Unregister a handle in root object.
 */
export function unregister(
    obj: RootType,
    path: PathType,
    handleId?: string | void
): boolean;