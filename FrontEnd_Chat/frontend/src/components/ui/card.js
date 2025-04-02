import React from "react";

export function Card({ className = "", children }) {
  return (
    <div className={`bg-white border rounded-lg p-4 shadow ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children }) {
  return <div>{children}</div>;
}
