'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Monitor, Settings } from 'lucide-react';

interface DashboardSelectorProps {
  onSelect: (type: 'unified' | 'standard') => void;
  defaultType?: 'unified' | 'standard';
}

export default function DashboardSelector({
  onSelect,
  defaultType = 'standard',
}: DashboardSelectorProps) {
  const [selected, setSelected] = useState<'unified' | 'standard'>(defaultType);
  const [saved, setSaved] = useState(false);

  const handleSelect = async (type: 'unified' | 'standard') => {
    setSelected(type);
    localStorage.setItem('dashboardView', type);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSelect(type);
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Vista del Dashboard
        </CardTitle>
        <CardDescription>
          Elige entre vista unificada (ambos módulos) o vista estándar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleSelect('unified')}
            className={`p-4 border-2 rounded-lg transition-all ${
              selected === 'unified'
                ? 'border-blue-600 bg-blue-100'
                : 'border-gray-200 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Vista Unificada</span>
            </div>
            <p className="text-sm text-gray-600">
              KPIs de Proyectos + Inventario en un solo lugar
            </p>
          </button>
          <button
            onClick={() => handleSelect('standard')}
            className={`p-4 border-2 rounded-lg transition-all ${
              selected === 'standard'
                ? 'border-blue-600 bg-blue-100'
                : 'border-gray-200 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Vista Estándar</span>
            </div>
            <p className="text-sm text-gray-600">
              Dashboard tradicional de Proyectos
            </p>
          </button>
        </div>
        {saved && (
          <div className="p-2 bg-green-100 text-green-700 rounded text-sm">
            ✓ Preferencia guardada
          </div>
        )}
      </CardContent>
    </Card>
  );
}
