/**
 * @file Useful TypeScript types
 */

/**
 * JSON-compatible value (i.e. suitable for MongoDB)
 */
export type JSONValue =
    | string
    | number
    | boolean
    | JSONObject
    | JSONArray;

export interface JSONObject {
    [x: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> { }