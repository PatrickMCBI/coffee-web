"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CATEGORIES } from "@/lib/constants";

const emptyForm = { name: "", description: "", price: "", category: CATEGORIES[0], imageUrl: "", available: true };

export default function MenuTab() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "menuItems"), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (item) => {
    setForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price ?? "",
      category: item.category || CATEGORIES[0],
      imageUrl: item.imageUrl || "",
      available: item.available !== false,
    });
    setEditingId(item.id);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.price === "") return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      imageUrl: form.imageUrl.trim(),
      available: !!form.available,
    };
    try {
      if (editingId) {
        await updateDoc(doc(db, "menuItems", editingId), payload);
      } else {
        await addDoc(collection(db, "menuItems"), payload);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this menu item?")) return;
    await deleteDoc(doc(db, "menuItems", id));
    if (editingId === id) resetForm();
  };

  const toggleAvailable = async (item) => {
    await updateDoc(doc(db, "menuItems", item.id), { available: !item.available });
  };

  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">{editingId ? "Edit item" : "Add menu item"}</h5>
            <form onSubmit={submit}>
              <div className="mb-2">
                <label className="form-label small">Name</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label small">Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label small">Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small">Category</label>
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label small">Image URL (optional)</label>
                <input
                  className="form-control"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="available"
                  checked={form.available}
                  onChange={(e) => setForm({ ...form, available: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="available">
                  Available on menu
                </label>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-coffee flex-grow-1" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Save changes" : "Add item"}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="table-responsive">
          <table className="table align-middle bg-white">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Available</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="fw-semibold">{item.name}</div>
                    <div className="text-muted small">{item.description}</div>
                  </td>
                  <td>{item.category}</td>
                  <td>₱{Number(item.price).toFixed(2)}</td>
                  <td>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={item.available !== false}
                        onChange={() => toggleAvailable(item)}
                      />
                    </div>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => startEdit(item)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(item.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No menu items yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
