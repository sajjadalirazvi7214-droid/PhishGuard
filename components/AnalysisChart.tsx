import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { RiskLevel } from '../types';

interface AnalysisChartProps {
  score: number;
  level: RiskLevel;
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ score, level }) => {
  const data = [{ name: 'Risk', value: score }];
  
  let color = '#22c55e'; // Green
  if (level === RiskLevel.SUSPICIOUS) color = '#f97316'; // Orange
  if (level === RiskLevel.MALICIOUS) color = '#ef4444'; // Red

  return (
    <div className="relative w-48 h-48 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={10} data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={30}
            fill={color}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Risk Score</span>
      </div>
    </div>
  );
};

export default AnalysisChart;