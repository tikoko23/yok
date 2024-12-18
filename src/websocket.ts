import { CFG_PATHS } from "./config-paths.ts";
import { getConfig } from "./config.ts";
import type { WebSocketEvent } from "./types.ts";
import { fetchUser } from "./user.ts";

export const SOCKETS: Record<string, WebSocket[]> = {};

const MAX_CONNECTIONS_PER_ACCOUNT = getConfig<number>(`${CFG_PATHS.socket}/max_connections_per_account`) ?? 16;

export function processSocketRequest(req: Request): Response {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (token === null)
        return new Response("Authorization header must be provided", { status: 401 });

    const user = fetchUser("token", token);

    if (user === null)
        return new Response("Invalid token", { status: 401 });

    const requestSocketKey = req.headers.get("Sec-WebSocket-Key");

    if (requestSocketKey === null)
        return new Response("Sec-WebSocket-Key was not provided", { status: 400 });

    const { socket, response } = Deno.upgradeWebSocket(req);

    if (SOCKETS[user.id] === undefined)
        SOCKETS[user.id] = [];

    if (SOCKETS[user.id].length >= MAX_CONNECTIONS_PER_ACCOUNT)
        return new Response(`Maximum connections per account is reached (${MAX_CONNECTIONS_PER_ACCOUNT})`, { status: 503 });

    SOCKETS[user.id].push(socket);

    socket.addEventListener("close", () => SOCKETS[user.id] = SOCKETS[user.id].filter(s => s !== socket));

    return response;
}

export function sendSocketEvent(socket: WebSocket, event: WebSocketEvent) {
    socket.send(JSON.stringify(event));
}