"use client"

import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"

type Point = { month: string; income: number; expense: number }

export function FinanceChart({ data }: { data: Point[] }) {
  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
          <YAxis stroke="rgba(255,255,255,0.6)" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#2563eb" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expense" stroke="#6b21a8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
