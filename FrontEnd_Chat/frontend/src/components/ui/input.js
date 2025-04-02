import React from "react";

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring focus:ring-blue-300 ${className}`}
      {...props}
    />
  );
}
