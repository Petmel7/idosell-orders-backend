
const axios = require("axios");
const fs = require("fs");

// const API_URL = "https://zooart6.yourtechnicaldomain.com/api/admin/v7/orders/orders?limit=10&offset=0";
const API_URL = "https://zooart6.yourtechnicaldomain.com/api/admin/v7/orders/orders/search";
const API_KEY = "YXBwbGljYXRpb24xNjpYeHI1K0MrNVRaOXBaY2lEcnpiQzBETUZROUxrRzFFYXZuMkx2L0RHRXZRdXNkcmF5R0Y3ZnhDMW1nejlmVmZP";

const payloads = [
    // A: most likely expected (numeric minutes)
    {
        name: "ordersDateRange_number",
        body: {
            ordersRange: { ordersDateRange: 60 },
            limit: 10,
            offset: 0
        }
    },
    // B: nested minutes object (what you used before)
    {
        name: "ordersDateRange_minutes_object",
        body: {
            ordersRange: { ordersDateRange: { minutes: 60 } },
            limit: 10,
            offset: 0
        }
    },
    // C: wrapped in search (some APIs expect a "search" wrapper)
    {
        name: "wrapped_search_numeric",
        body: {
            search: {
                ordersRange: { ordersDateRange: 60 }
            },
            limit: 10,
            offset: 0
        }
    },
    // D: explicit dateFrom/dateTo (ISO-ish strings) — useful if the API prefers explicit dates
    {
        name: "dateFrom_dateTo",
        body: {
            search: {
                dateFrom: "2025-09-24 00:00:00",
                dateTo: "2025-09-25 23:59:59"
            },
            limit: 10,
            offset: 0
        }
    }
];

async function testOne(p) {
    console.log("\n--- Test:", p.name, "---");
    console.log("Payload:", JSON.stringify(p.body));
    try {
        const res = await axios.post(API_URL, p.body, {
            headers: {
                "X-API-KEY": API_KEY,
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            timeout: 20000
        });
        console.log("Status:", res.status);
        console.log("Body:", JSON.stringify(res.data, null, 2).slice(0, 2000)); // preview
        // save full response for inspection
        fs.writeFileSync(`./response-${p.name}.json`, JSON.stringify(res.data, null, 2), "utf8");
        console.log("Saved: response-" + p.name + ".json");
    } catch (err) {
        const status = err.response?.status;
        const data = err.response?.data;
        console.error("Request failed. Status:", status);
        console.error("Response body:", data ? JSON.stringify(data, null, 2) : err.message);
        // save error body if exists
        if (data) fs.writeFileSync(`./error-${p.name}.json`, JSON.stringify(data, null, 2), "utf8");
    }
}

(async () => {
    for (const p of payloads) {
        await testOne(p);
    }
    console.log("\nDone. Перевір файли response-*.json / error-*.json в папці проекту.");
})();

