import * as SQLite from "@sqlite";
import { dirname } from "@std/path";
import { getConfig } from "./config.ts";
import { CFG_PATHS } from "./config-paths.ts";

export const MAXIMUM_DB_FETCH_SIZE = getConfig<number>(`${CFG_PATHS.db}/max_fetch_size`) ?? 32;

export type UserQueryResult = {
    id: number,
    name: string,
    displayName: string | null,
    email: string | null,
    createdAt: string,
    password: string,
    passwordSalt: string,
    token: string
}

export type GroupQueryResult = {
    id: number,
    name: string,
    ownerId: number,
    createdAt: string,
    inviteLink: string
}

export type MemberQueryResult = {
    groupId: number,
    userId: number,
    permissionLevel: number,
    joinedAt: string
}

export type MessageQueryResult = {
    id: number,
    groupId: number,
    authorId: number,
    replyId: number,
    createdAt: string,
    body: string,
    fullJson: string,
    attachments: string | null,
    editedAt: string | null
}

export let DB: SQLite.DB;

export function makeDB(path: string, args?: SQLite.SqliteOptions): SQLite.DB {
    let exists;
    try {
        Deno.lstatSync(path);
        exists = true;

    } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
            throw err;
        }

        exists = false;
    }

    if (!exists) {
        Deno.mkdirSync(dirname(path), { recursive: true });
        Deno.createSync(path).close();
    }

    return new SQLite.DB(path, args);
}

export function loadDefaultDB(): void {
    DB = makeDB("./data/main.db");
}

export function loadCustomDB(db: SQLite.DB): void {
    DB = db;
}

export function unloadDB(): void {
    DB.close();
}

export function initDefaultTables(DB: SQLite.DB): void {
    DB.query(`
        CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ownerId INTEGER,
            createdAt TEXT NOT NULL,
            inviteLink TEXT NOT NULL,
            UNIQUE(name)
        )
    `);

    DB.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            displayName TEXT,
            email TEXT,
            createdAt TEXT NOT NULL,
            password TEXT NOT NULL,
            passwordSalt TEXT NOT NULL,
            token TEXT NOT NULL,
            UNIQUE(name, email)
        )
    `);

    DB.query(`
        CREATE TABLE IF NOT EXISTS members (
            groupId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            permissionLevel INTEGER NOT NULL,
            joinedAt TEXT NOT NULL
        )
    `);

    DB.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            groupId INTEGER NOT NULL,
            authorId INTEGER NOT NULL,
            replyId INTEGER,
            createdAt TEXT NOT NULL,
            body TEXT NOT NULL,
            fullJson TEXT NOT NULL,
            attachments TEXT,
            editedAt TEXT
        )
    `);
}
