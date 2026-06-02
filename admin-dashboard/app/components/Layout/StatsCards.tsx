'use client';

import { 
  ExclamationTriangleIcon, 
  ClockIcon, 
  CalendarDaysIcon,
  CheckCircleIcon,
  ChartBarSquareIcon,
  FlagIcon
} from '@heroicons/react/24/outline';

interface StatsCardsProps {
  stats: any;
  additionalStats?: {
    daysSinceLastIncident: number;
    thisMonthIncidents: number;
    thisMonthFrequency: string;
    closedThisMonth: number;
    dueIncidents: number;
  };
}

export default function StatsCards({ stats, additionalStats }: StatsCardsProps) {
  const cards = [
    { 
      name: 'Active Incidents', 
      icon: ExclamationTriangleIcon, 
      value: stats.active_incidents, 
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
    { 
      name: 'Pending Approvals', 
      icon: ClockIcon, 
      value: stats.pending_approvals || 0, 
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    { 
      name: 'Days Since Last Incident', 
      icon: CalendarDaysIcon, 
      value: additionalStats?.daysSinceLastIncident || 0, 
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      suffix: 'days'
    },
    { 
      name: 'This Month', 
      icon: ChartBarSquareIcon, 
      value: additionalStats?.thisMonthIncidents || 0, 
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      subtitle: `${additionalStats?.thisMonthFrequency || '0%'} frequency`
    },
    { 
      name: 'Closed This Month', 
      icon: CheckCircleIcon, 
      value: additionalStats?.closedThisMonth || 0, 
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    { 
      name: 'Due Incidents', 
      icon: FlagIcon, 
      value: additionalStats?.dueIncidents || 0, 
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.name}
          className="relative overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <dt>
            <div className={`absolute rounded-lg ${card.bgColor} p-3`}>
              <card.icon className={`h-6 w-6 ${card.textColor}`} aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">{card.name}</p>
          </dt>
          <dd className="ml-16 flex flex-col pb-6">
            <p className="text-2xl font-semibold text-gray-900">
              {card.value} {card.suffix && <span className="text-sm font-normal">{card.suffix}</span>}
            </p>
            {card.subtitle && (
              <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
            )}
          </dd>
        </div>
      ))}
    </div>
  );
}
