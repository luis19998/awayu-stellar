import { handleOg } from "../../web/server/og.js";

export default async (req) => handleOg(req);
export const config = { path: "/api/og" };
