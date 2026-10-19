"use client";

import React from "react";

export default function StudioMerchantCatalogPage() {
  const products = [
    { id: "prod_991", title: "Wireless Noise-Canceling Headphones", price: "$129", qdrantPoint: "101", cosineThreshold: 0.85 },
    { id: "prod_992", title: "Mechanical Low-Profile Developer Keyboard", price: "$169", qdrantPoint: "102", cosineThreshold: 0.85 },
  ];

  return (
    <div style={{ padding: 24, background: "#080c14", color: "#f8fafc" }}>
      <h2>Creator Studio • Merchant Product Catalog (YOLOv11 + CLIP 512-dim Qdrant Index)</h2>
      <ul>
        {products.map((p) => (
          <li key={p.id} style={{ marginBottom: 10 }}>
            <strong>{p.title}</strong> ({p.price}) — Qdrant Point #{p.qdrantPoint} (Min Cosine: {p.cosineThreshold})
          </li>
        ))}
      </ul>
    </div>
  );
}

