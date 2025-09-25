
const axios = require("axios");

const API_URL = "https://zooart6.yourtechnicaldomain.com/api.php";
const API_KEY = "YXBwbGljYXRpb24xNjpYeHI1K0MrNVRaOXBaY2lEcnpiQzBETUZROUxrRzFFYXZuMkx2L0RHRXZRdXNkcmF5R0Y3ZnhDMW1nejlmVmZP"; // твій ключ

async function testApi(version = "1.0") {
    const payload = {
        service: "orders",
        method: "get",
        version,
        parameters: {
            ordersRange: {
                ordersDateRange: {
                    minutes: 60,
                },
            },
        },
    };

    console.log("🌍 Sending request to iDoSell...");
    console.log("🔑 Version:", version);
    console.log("📦 Payload:", JSON.stringify(payload, null, 2));

    try {
        const res = await axios.post(API_URL, payload, {
            headers: {
                "X-API-KEY": API_KEY,
                "Content-Type": "application/json",
            },
            timeout: 20000,
        });

        console.log("✅ Response status:", res.status);
        console.log("📥 Response body:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("❌ Request failed");
        console.error("Status:", err.response?.status);
        console.error("Body:", err.response?.data || err.message);
    }
}

// Testing different API versions
(async () => {
    for (const v of ["1.0", "3.0", "4.0"]) {
        console.log("\n============================");
        await testApi(v);
    }
})();
