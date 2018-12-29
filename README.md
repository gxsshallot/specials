# specials

[![npm version](https://img.shields.io/npm/v/specials.svg?style=flat)](https://www.npmjs.com/package/specials)
[![Build Status](https://travis-ci.org/gaoxiaosong/react-native-picklist.svg?branch=master)](https://travis-ci.org/gaoxiaosong/react-native-picklist)

A tool to manage general or special handle.

## Install

Install by Yarn:

```shell
yarn add specials
```

Install by NPM:

```shell
npm install --save specials
```

## Usage

Import the module in file:

```javascript
import * as Specials from 'specials';
```

### Storage

We use a root object to store all information. In each node, we can store a default handle and an array of special handles.

* `Specials.DEFAULT_HANDLE`: Key for default handle.
* `Specials.SPECIAL_PART`: Key for part of special handle.

Here is an example of a root object:

```
{
    [DEFAULT_HANDLE]: function f0 {.....},
    display: {
        text: {
            [DEFAULT_HANDLE]: function f1 {.....},
            phone: {
                [DEFAULT_HANDLE]: function f4 {.....},
            },
        },
        [SPECIAL_PART]: [
            {
                [kSpecial]: state => state === 'user',
                [kHandle]: function f2 {...},
                [kId]: 1,
                [kPriority]: 0,
            },
            {
                [kSpecial]: state => state === 'org',
                [kHandle]: function f3 {...},
                [kId]: 2,
                [kPriority]: 1,
            }
        ],
    },
    edit: {
        ...
    },
}
```

Each special part consists of four keys:

* `Specials.kId`: Identifier of handle. Used for unregister the handle.
* `Specials.kSpecial`: Special judging function. Returns a boolean.
* `Specials.kHandle`: Handle function when special function is valid.
* `Specials.kPriority`: Prority of handle when multi items are valid. Larger one will be used first. You can use `Specials.PRIORITY`.

### API

* `register: (obj, path, special, handle, priority) => number | void`: Register a default or special handle with priority. Return `handleId` if `special` is not `null`.
* `unregister: (obj, path, handleId) => boolean`: Unregister a default or special handle. Return true when succeed.
* `get: (obj, path, state, params) => any`: Get handle with a `state`. Then uses handle function with `params` or just returns the handle object.

### Example

First, initialize a root object:

```javascript
const rootNode = {};
```

Register different handle:

```javascript
Specials.register(rootNode, [], undefined, y => y);
Specials.register(rootNode, 'display', undefined, y => y + 1);
Specials.register(rootNode, ['display', 'text'], undefined, y => y + 2);
Specials.register(rootNode, 'display', x => x === 1, y => y - 1); // return: 1
Specials.register(rootNode, ['display', 'text'], x => x === 2, 'P1'); // return: 1
Specials.register(rootNode, ['display', 'text'], x => x === 2, 'P2', Specials.PRIORITY.HIGH); // return: 2
```

The root object will be:

```
{
    [DEFAULT_HANDLE]: y => y,
    display: {
        [DEFAULT_HANDLE]: y => y + 1,
        text: {
            [DEFAULT_HANDLE]: y => y + 2,
            [SPECIAL_PART]: [
                {
                    [kSpecial]: x => x === 2,
                    [kHandle]: 'P1',
                    [kId]: 1,
                    [kPriority]: 0,
                },
                {
                    [kSpecial]: x => x === 2,
                    [kHandle]: 'P2',
                    [kId]: 2,
                    [kPriority]: 255,
                },
            ],
        },
        [SPECIAL_PART]: [
            {
                [kSpecial]: x => x === 1,
                [kHandle]: y = y - 1,
                [kId]: 1,
                [kPriority]: 0,
            },
        ],
    },
}
```

Then use `get` to get handle:

```javascript
Specials.get(rootNode, [], undefined, undefined); // function: y => y
Specials.get(rootNode, [], undefined, 100); // y=>y result: 100
Specials.get(rootNode, ['display'], undefined, 100); // y=>y+1 result: 101
Specials.get(rootNode, ['parse'], undefined, 100); // y=>y result: 100
Specials.get(rootNode, ['display'], 1, 100); // y=>y-1 result: 99
Specials.get(rootNode, ['display'], 2, 100); // y=>y+1 result: 101
Specials.get(rootNode, ['display', 'text'], 1, 100); // y=y-1 result: 99
Specials.get(rootNode, ['display', 'text'], 2, 100); // 'P2' result: 'P2'
```

Finally we can unregister default or special handle:

```javascript
Specials.unregister(rootNode, []);
Specials.unregister(rootNode, 'display');
Specials.unregister(rootNode, ['display', 'text']);
Specials.unregister(rootNode, 'display', 1); // return: true
Specials.unregister(rootNode, ['display', 'text'], 1); // return: true
Specials.unregister(rootNode, ['display', 'text'], 2); // return: true
Specials.unregister(rootNode, ['display', 'text'], 3); // return: false
```