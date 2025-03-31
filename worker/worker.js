export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // 设置 CORS 头部
        const headers = {
            "Access-Control-Allow-Origin": "*", // 允许所有源访问
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // 允许的请求方法
            "Access-Control-Allow-Headers": "Content-Type, Authorization", // 允许的请求头
        };

        if (request.method === "OPTIONS") {
            // 预检请求处理
            return new Response(null, {
                status: 204,
                headers: headers,
            });
        }

        if (url.pathname === "/set") {
            // 处理 MicroDroid 上报
            let params = url.searchParams;
            let secret = params.get("secret");
            let status = params.get("status");
            let app_name = params.get("app_name") || "未知";

            if (secret !== "114514") {
                return new Response(JSON.stringify({ success: false, error: "error" }), { status: 403, headers });
            }

            let data = { status, app_name, time: Date.now() };
            await env.STATE_KV.put("status", JSON.stringify(data));

            return new Response(JSON.stringify({ success: true, message: "Synced" }), { status: 200, headers });
        }

        if (url.pathname === "/query") {
            // 处理前端查询
            let data = await env.STATE_KV.get("status", { type: "json" });

            if (!data) {
                return new Response(JSON.stringify({ success: false, error: "无状态数据" }), { status: 404, headers });
            }

            let now = Date.now();
            let lastUpdate = data.time || 0;
            let isOnline = now - lastUpdate < 60000; // 60 秒内视为在线

            return new Response(JSON.stringify({
                success: true,
                info: {
                    name: isOnline ? "在线" : "离线",
                    desc: isOnline ? "最近有活动" : "超过 1 分钟未更新"
                },
                app_name: data.app_name
            }), { status: 200, headers });
        }

        return new Response("404 Not Found", { status: 404, headers });
    }
};
