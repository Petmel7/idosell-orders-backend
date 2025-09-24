
const { createObjectCsvStringifier } = require('csv-writer');

/**
 * Stream orders as CSV into an Express response.
 *
 * Orders expected shape (flexible):
 *  - orderNumber | order_number | id
 *  - totalAmount | total_amount | amount
 *  - status
 *  - products: [{ productId | id | product_id, quantity | qty }]
 *
 * Why: keep function tolerant to variations in iDoSell response and avoid OOM by chunking.
 */
function streamOrdersAsCsv(orders = [], res) {
    if (!res || typeof res.write !== 'function') {
        throw new TypeError('streamOrdersAsCsv: second argument must be an Express response');
    }

    const csvStringifier = createObjectCsvStringifier({
        header: [
            { id: 'orderNumber', title: 'orderNumber' },
            { id: 'totalAmount', title: 'totalAmount' },
            { id: 'status', title: 'status' },
            { id: 'products', title: 'products' },
        ],
    });

    // write CSV header
    res.write(csvStringifier.getHeaderString());

    // helper: normalize a single product entry to "productIdxQuantity"
    const formatProduct = (p = {}) => {
        const id = p.productId ?? p.id ?? p.product_id ?? p.variant_id ?? '';
        const qty = Number(p.quantity ?? p.qty ?? p.count ?? 0);
        return `${String(id)}x${Number.isFinite(qty) ? qty : 0}`;
    };

    // helper: get numeric amount formatted with 2 decimals or empty string
    const formatAmount = (raw) => {
        const n = Number(raw);
        if (Number.isFinite(n)) return n.toFixed(2);
        return '';
    };

    // Process in chunks to avoid building one huge CSV string in memory
    const CHUNK_SIZE = 250; // tweakable depending on memory
    for (let i = 0; i < orders.length; i += CHUNK_SIZE) {
        const slice = orders.slice(i, i + CHUNK_SIZE);

        const records = slice.map((o) => {
            // try multiple possible field names to be robust
            const orderNumber = o.orderNumber ?? o.order_number ?? o.number ?? o.id ?? '';
            const totalAmount = o.totalAmount ?? o.total_amount ?? o.amount ?? (o.raw && (o.raw.total_amount ?? o.raw.amount)) ?? '';
            const status = (o.status ?? (o.raw && o.raw.status) ?? '').toString();

            const productsArr = Array.isArray(o.products) ? o.products
                : Array.isArray(o.raw && o.raw.products) ? o.raw.products
                    : [];

            const products = productsArr.map(formatProduct).join('|');

            return {
                orderNumber: String(orderNumber),
                totalAmount: formatAmount(totalAmount),
                status,
                products,
            };
        });

        // stringify and write this chunk
        res.write(csvStringifier.stringifyRecords(records));
    }

    // finish response
    res.end();
}

module.exports = { streamOrdersAsCsv };

