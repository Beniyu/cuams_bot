/**
 * @file Database-friendly representation of discord items
 */

import {DatabaseCollection} from "./database";
import {Button} from "./buttons";
import {JSONValue} from "./types";

export interface ItemStore {
    [x: string]: string;
}

export interface BasicGuildItem {
    _id: string;
}

export interface BasicUserItem extends BasicGuildItem {
    _id: string;
    permissions: string[];
}

export interface BasicRoleItem extends BasicGuildItem {
    _id: string;
    permissions: string[];
}

export interface BasicChannelItem extends BasicGuildItem {
    _id: string;
    buttons: { [x: string] : Button };
    allowedCommands: string[]
}

export interface BasicSettingsItem extends BasicGuildItem {
    _id: string;
    data: JSONValue;
}

/**
 * Template for discord item stored in database
 */
export abstract class GuildItem extends Object implements BasicGuildItem {
    _id: string;
    abstract _collection: DatabaseCollection; // Database collection item is stored in

    protected constructor(id?: string) {
        super()
        this._id = id;
    }

    /**
     * Get instance with default settings
     * @param id Item ID
     */
    static getEmpty(id: string) : GuildItem {
        throw new Error("Not implemented!");
    }

    /**
     * Import json object as class instance
     * @param jsonObject JSON Object
     */
    abstract import(jsonObject: BasicGuildItem) : GuildItem;

    /**
     * Get pure value representation of database item
     */
    get json() {
        let jsonObject = {};
        for (let key of Object.keys(this)) {
            if (typeof this[key] === 'undefined' || key === "_collection") continue;
            jsonObject[key] = this[key];
        }
        return jsonObject;
    }

    get collection() : DatabaseCollection {
        return this._collection;
    }
}

/**
 * Template for discord item with permissions
 */
export abstract class PermissionedGuildItem extends GuildItem {
    permissions: string[];

    constructor(id?: string, permissions?: string[]) {
        super(id);
        this.permissions = permissions;
    }
}

/**
 * Template for discord user in database
 */
export class UserItem extends PermissionedGuildItem implements BasicUserItem {
    _collection = DatabaseCollection.USERS;
    static getEmpty(id: string) : UserItem {
        return new UserItem(id, []);
    }

    import(obj: BasicUserItem) : UserItem {
        return new UserItem(obj._id, obj.permissions);
    }
}

/**
 * Template for discord role in database
 */
export class RoleItem extends PermissionedGuildItem implements BasicRoleItem {
    _collection = DatabaseCollection.ROLES;
    static getEmpty(id: string) : RoleItem {
        return new RoleItem(id, []);
    }

    import(obj: BasicRoleItem) : RoleItem {
        return new RoleItem(obj._id, obj.permissions);
    }
}

/**
 * Template for discord channel in database
 */
export class ChannelItem extends GuildItem implements BasicChannelItem {
    buttons: { [x: string] : Button };
    allowedCommands: string[];
    _collection = DatabaseCollection.CHANNELS;

    constructor(id?: string, buttons?: { [x: string] : Button }, allowedCommands?: string[]) {
        super(id);
        this.buttons = buttons;
        this.allowedCommands = allowedCommands;
    }

    static getEmpty(id: string) : ChannelItem {
        return new ChannelItem(id, {}, []);
    }

    import(obj: BasicChannelItem) : ChannelItem {
        return new ChannelItem(obj._id, obj.buttons, obj.allowedCommands);
    }
}

/**
 * Template for storage for non-localised functions
 */
export class SettingsItem extends GuildItem implements BasicSettingsItem {
    _collection: DatabaseCollection = DatabaseCollection.SETTINGS;
    data: JSONValue;

    constructor(settingName: string, settingData?: JSONValue) {
        super(settingName);
        this.data = settingData;
    }

    static getEmpty(settingName: string) {
        return new SettingsItem(settingName, null);
    }

    import(obj: BasicSettingsItem): GuildItem {
        return new SettingsItem(obj._id, obj.data);
    }
}