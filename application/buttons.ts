/**
 * @file Interfaces and enums relating to buttons
 */

import {JSONObject} from "./types";

export enum ButtonType {
    ACTION = "action"
}

export interface Button {
    type: string; // ButtonType
    data: JSONObject;
}