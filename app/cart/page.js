"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import SiteNavbar from "@/components/SiteNavbar";

export default function CartPage() {
  const { items, updateQty, removeItem, total, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const placeOrder = async (e) => {
    e.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!customerName.trim()) {
      setError("Please enter your name for the order.");
      return;
    }
    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        total,
        customerName: customerName.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      clearCart();
      router.push(`/order/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setError("Could not place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SiteNavbar />
      <main className="container py-4">
        <h2 className="mb-4">Your cart</h2>

        {items.length === 0 ? (
          <div className="alert alert-secondary">
            Your cart is empty. <a href="/">Browse the menu</a>.
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-lg-7">
              <ul className="list-group">
                {items.map((i) => (
                  <li key={i.id} className="list-group-item d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-semibold">{i.name}</div>
                      <div className="text-muted small">₱{i.price.toFixed(2)} each</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="input-group input-group-sm" style={{ width: 120 }}>
                        <button className="btn btn-outline-secondary" onClick={() => updateQty(i.id, i.qty - 1)}>
                          -
                        </button>
                        <span className="form-control text-center">{i.qty}</span>
                        <button className="btn btn-outline-secondary" onClick={() => updateQty(i.id, i.qty + 1)}>
                          +
                        </button>
                      </div>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(i.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="d-flex justify-content-between mt-3 fs-5">
                <strong>Total</strong>
                <strong>₱{total.toFixed(2)}</strong>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">Checkout details</h5>
                  <form onSubmit={placeOrder}>
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        className="form-control"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone (optional)</label>
                      <input
                        className="form-control"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09xx xxx xxxx"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Notes (optional)</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. less sugar, oat milk"
                      />
                    </div>
                    {error && <div className="alert alert-danger py-2">{error}</div>}
                    <button className="btn btn-coffee w-100" disabled={submitting}>
                      {submitting ? "Placing order..." : `Place order · ₱${total.toFixed(2)}`}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
