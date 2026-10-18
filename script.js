// Gem & Glow demo storefront. Update the product data and checkout link before launch.
const products = {
  bloom: { name: "Petal by Petal", price: 420, detail: "Floral diamond painting kit" },
  color: { name: "Color Me Happy", price: 510, detail: "Abstract diamond painting kit" },
  golden: { name: "Golden Hour", price: 465, detail: "Landscape diamond painting kit" },
  starter: { name: "The Happy Starter", price: 590, detail: "All-in-one starter kit" }
};
const cart = {};
const money = amount => `EGP ${amount.toLocaleString("en-US")}`;
const cartOverlay = document.getElementById("cartOverlay");
const cartItems = document.getElementById("cartItems");
const toast = document.getElementById("toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
function addToCart(id) {
  if (!products[id]) return;
  cart[id] = (cart[id] || 0) + 1;
  renderCart();
  openCart();
  showToast(`${products[id].name} added to your bag ✦`);
}
function changeQuantity(id, amount) {
  cart[id] = (cart[id] || 0) + amount;
  if (cart[id] <= 0) delete cart[id];
  renderCart();
}
function renderCart() {
  const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const total = Object.entries(cart).reduce((sum, [id, qty]) => sum + products[id].price * qty, 0);
  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartCountHeading").textContent = `(${count})`;
  document.getElementById("cartTotal").textContent = money(total);
  if (!count) {
    cartItems.innerHTML = '<p class="empty-cart">Your bag is waiting for a little sparkle ✧</p>';
    return;
  }
  cartItems.innerHTML = Object.entries(cart).map(([id, qty]) => `
    <article class="cart-item">
      <div><h3>${products[id].name}</h3><p>${products[id].detail}</p>
        <div class="cart-item-controls">
          <button data-action="minus" data-id="${id}" aria-label="Remove one ${products[id].name}">−</button>
          <span>${qty}</span>
          <button data-action="plus" data-id="${id}" aria-label="Add one ${products[id].name}">+</button>
          <button class="remove-item" data-action="remove" data-id="${id}">Remove</button>
        </div>
      </div><strong>${money(products[id].price * qty)}</strong>
    </article>`).join("");
}
function openCart() {
  cartOverlay.classList.add("open");
  cartOverlay.setAttribute("aria-hidden", "false");
  document.getElementById("cartClose").focus();
}
function closeCart() {
  cartOverlay.classList.remove("open");
  cartOverlay.setAttribute("aria-hidden", "true");
  document.getElementById("cartOpen").focus();
}

document.querySelectorAll(".quick-add").forEach(button => button.addEventListener("click", () => addToCart(button.dataset.id)));
document.getElementById("cartOpen").addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", event => { if (event.target === cartOverlay) closeCart(); });
cartItems.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { id, action } = button.dataset;
  if (action === "plus") changeQuantity(id, 1);
  if (action === "minus") changeQuantity(id, -1);
  if (action === "remove") { delete cart[id]; renderCart(); }
});
document.addEventListener("keydown", event => { if (event.key === "Escape" && cartOverlay.classList.contains("open")) closeCart(); });

document.querySelectorAll(".filter-chip").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".filter-chip").forEach(chip => chip.classList.toggle("active", chip === button));
  document.querySelectorAll(".product-card").forEach(card => {
    card.hidden = button.dataset.filter !== "all" && card.dataset.category !== button.dataset.filter;
  });
}));
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  mainNav.classList.toggle("open", !expanded);
});
mainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

document.getElementById("newsletterForm").addEventListener("submit", event => {
  event.preventDefault();
  const email = document.getElementById("emailInput").value.trim();
  if (!email) return;

  // Save subscriber to localStorage list
  try {
    const subscribers = JSON.parse(localStorage.getItem("yz_newsletter_subscribers") || "[]");
    if (!subscribers.some(sub => sub.email === email)) {
      subscribers.unshift({
        email: email,
        subscribedAt: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
      });
      localStorage.setItem("yz_newsletter_subscribers", JSON.stringify(subscribers));
    }
  } catch (err) {
    console.error("Failed to save newsletter email:", err);
  }

  document.getElementById("newsletterMessage").textContent = `✨ Thank you for subscribing! We've added ${email} to our VIP list.`;
  showToast("Subscribed successfully! ✦");
  event.target.reset();
});
// Checkout & Payment Handling
const checkoutOverlay = document.getElementById("checkoutOverlay");
const checkoutClose = document.getElementById("checkoutClose");
const checkoutSummaryTotal = document.getElementById("checkoutSummaryTotal");
const checkoutSummaryList = document.getElementById("checkoutSummaryList");
const orderForm = document.getElementById("orderForm");
const instapayDetails = document.getElementById("instapayDetails");
const successOverlay = document.getElementById("successOverlay");
const successOrderDetails = document.getElementById("successOrderDetails");
const successCloseBtn = document.getElementById("successCloseBtn");
const copyInstapayBtn = document.getElementById("copyInstapayBtn");

function openCheckout() {
  const total = Object.entries(cart).reduce((sum, [id, qty]) => sum + products[id].price * qty, 0);
  if (!total) {
    showToast("Add a little sparkle to your bag first ✧");
    return;
  }
  closeCart();
  checkoutSummaryTotal.textContent = money(total);
  checkoutSummaryList.innerHTML = Object.entries(cart).map(([id, qty]) => `
    <div style="display:flex; justify-content:space-between;">
      <span>${products[id].name} × ${qty}</span>
      <strong>${money(products[id].price * qty)}</strong>
    </div>
  `).join("");
  checkoutOverlay.classList.add("open");
  checkoutOverlay.setAttribute("aria-hidden", "false");
}

function closeCheckout() {
  checkoutOverlay.classList.remove("open");
  checkoutOverlay.setAttribute("aria-hidden", "true");
}

document.getElementById("checkoutButton").addEventListener("click", openCheckout);
checkoutClose.addEventListener("click", closeCheckout);

// Toggle payment details
document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
  radio.addEventListener("change", (e) => {
    if (e.target.value === "instapay") {
      instapayDetails.style.display = "block";
    } else {
      instapayDetails.style.display = "none";
    }
  });
});

// Copy InstaPay handle
copyInstapayBtn.addEventListener("click", () => {
  navigator.clipboard.writeText("crystal.zy@instapay").then(() => {
    showToast("InstaPay handle copied to clipboard!");
  }).catch(() => {
    showToast("Address: crystal.zy@instapay");
  });
});

// Process Order Submission
orderForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const city = document.getElementById("custCity").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const method = document.querySelector('input[name="paymentMethod"]:checked').value;
  const methodLabel = method === "instapay" ? "⚡ InstaPay Transfer" : "💵 Cash on Delivery (COD)";
  
  const total = Object.entries(cart).reduce((sum, [id, qty]) => sum + products[id].price * qty, 0);
  const itemsText = Object.entries(cart).map(([id, qty]) => `${products[id].name} (x${qty})`).join(", ");
  const orderId = "YZ-" + Math.floor(100000 + Math.random() * 900000);

  const newOrder = {
    orderId,
    date: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
    name,
    phone,
    city,
    address,
    itemsText,
    total,
    paymentMethod: method
  };

  // 1. Save order into localStorage for the Admin Dashboard (admin.html)
  try {
    const existingOrders = JSON.parse(localStorage.getItem("yz_orders") || "[]");
    existingOrders.unshift(newOrder);
    localStorage.setItem("yz_orders", JSON.stringify(existingOrders));
  } catch (err) {
    console.error("Failed to save order locally:", err);
  }

  // Pre-formatted message for Instagram / WhatsApp
  const orderMessage = encodeURIComponent(
    `Hello YZ Studio! I just placed an order 🛍️\n\n` +
    `• Order ID: #${orderId}\n` +
    `• Name: ${name}\n` +
    `• Phone: ${phone}\n` +
    `• Address: ${address}, ${city}\n` +
    `• Items: ${itemsText}\n` +
    `• Total: ${money(total)}\n` +
    `• Payment: ${methodLabel}`
  );

  // Update Instagram confirmation button
  const instaBtn = document.getElementById("successInstaBtn");
  if (instaBtn) {
    instaBtn.href = "https://www.instagram.com/cyrstal.zy?obrf=MWVlNjk5ZWZmbjJ0YQ==";
    instaBtn.title = "Send details to @cyrstal.zy on Instagram";
  }

  // Show confirmation modal
  successOrderDetails.innerHTML = `
    <strong>Order ID:</strong> #${orderId}<br>
    <strong>Customer:</strong> ${name}<br>
    <strong>Phone:</strong> ${phone}<br>
    <strong>Delivery:</strong> ${address}, ${city}<br>
    <strong>Items:</strong> ${itemsText}<br>
    <strong>Total:</strong> ${money(total)}<br>
    <strong>Payment:</strong> ${methodLabel}
  `;

  closeCheckout();
  successOverlay.classList.add("open");
  successOverlay.setAttribute("aria-hidden", "false");

  // Clear cart
  for (let key in cart) delete cart[key];
  renderCart();
  orderForm.reset();
});

successCloseBtn.addEventListener("click", () => {
  successOverlay.classList.remove("open");
  successOverlay.setAttribute("aria-hidden", "true");
});

document.getElementById("year").textContent = new Date().getFullYear();
renderCart();

