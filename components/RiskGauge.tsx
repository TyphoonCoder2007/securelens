import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface RiskGaugeProps {
  score: number;
  level: string;
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];

  let color = '#22c55e'; // Green
  if (score > 20) color = '#eab308'; // Yellow
  if (score > 50) color = '#f97316'; // Orange
  if (score > 75) color = '#ef4444'; // Red

  const COLORS = [color, '#e2e8f0'];

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="relative w-64 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-0 left-0 w-full text-center mb-[-5px]">
            <span className="text-4xl font-bold text-slate-800">{score}</span>
            <span className="text-sm text-slate-400">/100</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <h3 className="text-lg font-semibold text-slate-700">Risk Score</h3>
        <span 
          className="inline-block px-3 py-1 mt-2 text-sm font-bold rounded-full"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {level}
        </span>
      </div>
    </div>
  );
};

export default RiskGauge;