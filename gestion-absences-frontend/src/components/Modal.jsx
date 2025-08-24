import React from "react";

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <div className="font-semibold">{title}</div>
          <button className="btn" onClick={onClose}>Fermer</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
