document.addEventListener("DOMContentLoaded", async () => {
    const statProducts = document.getElementById("statProducts");
    if (!statProducts) return; // not on admin page

    function money(n) {
        return "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
    }
    function setAlert(message, type = "danger") {
        const el = document.getElementById("adminAlert");
        el.className = `alert alert-${type}`;
        el.textContent = message;
        el.classList.remove("d-none");
        setTimeout(() => el.classList.add("d-none"), 3500);
    }

    /* ---------- Sidebar tab switching ---------- */
    document.querySelectorAll(".admin-sidebar .nav-link[data-pane]").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".admin-sidebar .nav-link").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            document.querySelectorAll(".admin-pane").forEach((p) => p.classList.add("d-none"));
            document.querySelector(`.admin-pane[data-pane="${btn.dataset.pane}"]`).classList.remove("d-none");
        });
    });

    /* ---------- Stats ---------- */
    try {
        const stats = await Api.get("/owners/stats");
        document.getElementById("statProducts").textContent = stats.products;
        document.getElementById("statCustomers").textContent = stats.customers;
        document.getElementById("statOrders").textContent = stats.orders;
        document.getElementById("statRevenue").textContent = money(stats.revenue);
    } catch (err) {
        setAlert("Sign in as a store owner to view the dashboard.");
        setTimeout(() => (window.location.href = "/login?redirect=/admin"), 1200);
        return;
    }

    /* ---------- Products table ---------- */
    async function loadProducts() {
        const { products } = await Api.get("/products");
        const tbody = document.getElementById("productsTableBody");
        if (!products.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No products yet.</td></tr>`;
            return;
        }
        tbody.innerHTML = products.map((p) => `
            <tr>
                <td><img class="thumb" src="${p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"}" alt=""></td>
                <td>${p.name}</td>
                <td>${money(p.price)}</td>
                <td>${p.discount || 0}%</td>
                <td>
                    <button class="btn btn-sm btn-outline-ink me-1 edit-product-btn" data-id="${p._id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger delete-product-btn" data-id="${p._id}"><i class="bi bi-trash3"></i></button>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll(".edit-product-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const p = products.find((x) => x._id === btn.dataset.id);
                document.getElementById("productModalTitle").textContent = "Edit product";
                document.getElementById("productId").value = p._id;
                document.getElementById("pName").value = p.name;
                document.getElementById("pPrice").value = p.price;
                document.getElementById("pDiscount").value = p.discount || 0;
                document.getElementById("pImage").value = p.image || "";
                new bootstrap.Modal(document.getElementById("productModal")).show();
            });
        });

        tbody.querySelectorAll(".delete-product-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Delete this product?")) return;
                try {
                    await Api.del(`/products/${btn.dataset.id}`);
                    showToast("Product deleted");
                    loadProducts();
                } catch (err) {
                    setAlert(err.message);
                }
            });
        });
    }

    document.getElementById("newProductBtn").addEventListener("click", () => {
        document.getElementById("productModalTitle").textContent = "Add product";
        document.getElementById("productForm").reset();
        document.getElementById("productId").value = "";
    });

    document.getElementById("saveProductBtn").addEventListener("click", async () => {
        const id = document.getElementById("productId").value;
        const payload = {
            name: document.getElementById("pName").value.trim(),
            price: parseFloat(document.getElementById("pPrice").value),
            discount: parseFloat(document.getElementById("pDiscount").value || 0),
            image: document.getElementById("pImage").value.trim(),
        };
        if (!payload.name || isNaN(payload.price)) {
            setAlert("Name and price are required.");
            return;
        }
        try {
            if (id) {
                await Api.put(`/products/${id}`, payload);
                showToast("Product updated");
            } else {
                await Api.post("/products/create", payload);
                showToast("Product created");
            }
            bootstrap.Modal.getInstance(document.getElementById("productModal")).hide();
            loadProducts();
        } catch (err) {
            setAlert(err.message);
        }
    });

    /* ---------- Orders table ---------- */
    async function loadOrders() {
        const tbody = document.getElementById("ordersTableBody");
        try {
            const { orders } = await Api.get("/owners/orders");
            if (!orders.length) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No orders yet.</td></tr>`;
                return;
            }
            tbody.innerHTML = orders.map((o) => `
                <tr>
                    <td>${o.customerName}<br><span class="text-muted small">${o.customerEmail}</span></td>
                    <td>${o.items.length}</td>
                    <td>${money(o.total)}</td>
                    <td><span class="order-status ${o.status === "delivered" ? "delivered" : "pending"}">${o.status}</span></td>
                    <td>${new Date(o.placedAt).toLocaleDateString("en-IN")}</td>
                </tr>
            `).join("");
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">${err.message}</td></tr>`;
        }
    }

    loadProducts();
    loadOrders();
});
