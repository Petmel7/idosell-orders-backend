
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Order = require("../src/models/order.model");
const orderService = require("../src/services/order.service");

// 🔧 підмінимо idosell.service, щоб не ходити у реальне API
jest.mock("../src/services/idosell.service", () => ({
    fetchRecentOrders: jest.fn(),
}));

const idosell = require("../src/services/idosell.service");

describe("Order sync full cycle", () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        jest.clearAllMocks();
        await Order.deleteMany({});
    });

    test("should create new orders on first sync", async () => {
        idosell.fetchRecentOrders.mockResolvedValueOnce([
            { orderId: "A-1", orderSerialNumber: 1, products: [], total: 100, status: "new" },
            { orderId: "B-2", orderSerialNumber: 2, products: [], total: 200, status: "new" },
        ]);

        const results = await orderService.upsertOrdersFromIdoSell();

        expect(results.map(r => r.action)).toEqual(["created", "created"]);
        const orders = await Order.find();
        expect(orders).toHaveLength(2);
    });

    test("should update existing order if fields changed", async () => {
        // 1️⃣ Створимо замовлення
        const existing = await Order.create({
            orderNumber: "1",
            products: [{ productId: "X", quantity: 1 }],
            totalAmount: 100,
            status: "new",
        });

        // 2️⃣ Мокуємо нові дані з API
        idosell.fetchRecentOrders.mockResolvedValueOnce([
            { orderId: "X-1", orderSerialNumber: 1, products: [{ productId: "X", quantity: 2 }], total: 150, status: "new" },
        ]);

        const results = await orderService.upsertOrdersFromIdoSell();

        expect(results[0].action).toBe("updated");

        const updated = await Order.findOne({ orderNumber: "1" });
        expect(updated.totalAmount).toBe(150);
        expect(updated.products[0].quantity).toBe(2);
    });

    test("should skip if nothing changed", async () => {
        await Order.create({
            orderNumber: "2",
            products: [{ productId: "P", quantity: 1 }],
            totalAmount: 50,
            status: "new",
        });

        idosell.fetchRecentOrders.mockResolvedValueOnce([
            { orderId: "Y-2", orderSerialNumber: 2, products: [{ productId: "P", quantity: 1 }], total: 50, status: "new" },
        ]);

        const results = await orderService.upsertOrdersFromIdoSell();

        expect(results[0].action).toBe("skipped");
    });

    test("should stop updating finished orders", async () => {
        await Order.create({
            orderNumber: "3",
            products: [{ productId: "Z", quantity: 1 }],
            totalAmount: 80,
            status: "finished", // фінальний статус
        });

        idosell.fetchRecentOrders.mockResolvedValueOnce([
            { orderId: "Z-3", orderSerialNumber: 3, products: [{ productId: "Z", quantity: 5 }], total: 500, status: "new" },
        ]);

        const results = await orderService.updatePendingOrders();

        expect(results).toHaveLength(0); // нічого не оновилось
        const unchanged = await Order.findOne({ orderNumber: "3" });
        expect(unchanged.totalAmount).toBe(80);
    });
});
