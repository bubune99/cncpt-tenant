'use client';

/**
 * Plugin UI Puck Components
 *
 * Visual components for building plugin settings pages, dashboard widgets,
 * and custom admin pages using Puck visual editor.
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';

// ============================================================================
// WIDGET COMPONENTS (Dashboard widgets)
// ============================================================================

export interface StatWidgetProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
  backgroundColor?: string;
}

export function StatWidget({
  title,
  value,
  change,
  changeType = 'neutral',
  icon = 'BarChart',
  backgroundColor = '#ffffff',
}: StatWidgetProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = ((LucideIcons as any)[icon] as React.ComponentType<{ className?: string }>) || LucideIcons.BarChart;

  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div
      className="rounded-lg border border-gray-200 p-4 shadow-sm"
      style={{ backgroundColor }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {change && (
        <p className={`mt-1 text-sm ${changeColors[changeType]}`}>{change}</p>
      )}
    </div>
  );
}

export interface ChartWidgetProps {
  title: string;
  chartType: 'bar' | 'line' | 'pie';
  dataSource?: string;
  height?: number;
  backgroundColor?: string;
}

export function ChartWidget({
  title,
  chartType = 'bar',
  height = 200,
  backgroundColor = '#ffffff',
}: ChartWidgetProps) {
  // Placeholder chart visualization
  const chartIcons = {
    bar: LucideIcons.BarChart3,
    line: LucideIcons.LineChart,
    pie: LucideIcons.PieChart,
  };
  const Icon = chartIcons[chartType];

  return (
    <div
      className="rounded-lg border border-gray-200 p-4 shadow-sm"
      style={{ backgroundColor }}
    >
      <p className="text-sm font-medium text-gray-600 mb-4">{title}</p>
      <div
        className="flex items-center justify-center bg-gray-50 rounded-md border border-dashed border-gray-300"
        style={{ height }}
      >
        <div className="text-center">
          <Icon className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="mt-2 text-sm text-gray-400">Chart Placeholder</p>
          <p className="text-xs text-gray-400">Connect to data source</p>
        </div>
      </div>
    </div>
  );
}

export interface TableWidgetProps {
  title: string;
  columns: string;
  dataSource?: string;
  maxRows?: number;
  backgroundColor?: string;
}

export function TableWidget({
  title,
  columns = 'Name,Value,Status',
  maxRows = 5,
  backgroundColor = '#ffffff',
}: TableWidgetProps) {
  const cols = columns.split(',').map(c => c.trim());

  return (
    <div
      className="rounded-lg border border-gray-200 p-4 shadow-sm"
      style={{ backgroundColor }}
    >
      <p className="text-sm font-medium text-gray-600 mb-4">{title}</p>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {cols.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: maxRows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {cols.map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-2 text-sm text-gray-400">
                    —
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface ActivityWidgetProps {
  title: string;
  maxItems?: number;
  backgroundColor?: string;
}

export function ActivityWidget({
  title = 'Recent Activity',
  maxItems = 5,
  backgroundColor = '#ffffff',
}: ActivityWidgetProps) {
  return (
    <div
      className="rounded-lg border border-gray-200 p-4 shadow-sm"
      style={{ backgroundColor }}
    >
      <p className="text-sm font-medium text-gray-600 mb-4">{title}</p>
      <div className="space-y-3">
        {Array.from({ length: maxItems }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-2 h-2 mt-2 rounded-full bg-gray-300" />
            <div className="flex-1">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-50 rounded w-1/2 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// FORM COMPONENTS (Settings forms)
// ============================================================================

export interface FormSectionProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

export interface TextInputFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'url' | 'password';
}

export function TextInputField({
  label,
  name,
  placeholder = '',
  helpText,
  required = false,
  type = 'text',
}: TextInputFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        placeholder={placeholder}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
  );
}

export interface SelectFieldProps {
  label: string;
  name: string;
  options: string;
  helpText?: string;
  required?: boolean;
}

export function SelectField({
  label,
  name,
  options = 'Option 1,Option 2,Option 3',
  helpText,
  required = false,
}: SelectFieldProps) {
  const opts = options.split(',').map(o => o.trim());

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={name}
        name={name}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        {opts.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
  );
}

export interface ToggleFieldProps {
  label: string;
  name: string;
  description?: string;
  defaultEnabled?: boolean;
  onChange?: (enabled: boolean) => void;
}

export function ToggleField({
  label,
  name,
  description,
  defaultEnabled = false,
  onChange,
}: ToggleFieldProps) {
  const [enabled, setEnabled] = React.useState(defaultEnabled);

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        id={name}
        role="switch"
        aria-checked={enabled}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

export interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function PageHeader({
  title,
  description,
  showBackButton = false,
  onBack,
}: PageHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="border-b border-gray-200 pb-4 mb-6">
      {showBackButton && (
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
          aria-label="Go back"
        >
          <LucideIcons.ArrowLeft className="h-4 w-4" />
          Back
        </button>
      )}
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

export interface CardContainerProps {
  title?: string;
  padding?: number;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export function CardContainer({
  title,
  padding = 16,
  backgroundColor = '#ffffff',
  children,
}: CardContainerProps) {
  return (
    <div
      className="rounded-lg border border-gray-200 shadow-sm"
      style={{ backgroundColor, padding }}
    >
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
}

export interface GridLayoutProps {
  columns: number;
  gap?: number;
  children?: React.ReactNode;
}

export function GridLayout({
  columns = 2,
  gap = 16,
  children,
}: GridLayoutProps) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  );
}

export interface TabsContainerProps {
  tabs: string;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
}

export function TabsContainer({
  tabs = 'General,Advanced,API',
  defaultTab,
  onTabChange,
}: TabsContainerProps) {
  const tabList = tabs.split(',').map(t => t.trim());
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabList[0]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" role="tablist">
          {tabList.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              role="tab"
              aria-selected={tab === activeTab}
              className={`whitespace-nowrap py-4 px-1 border-b-2 text-sm font-medium ${
                tab === activeTab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-4" role="tabpanel">
        <div className="bg-gray-50 rounded-lg p-8 border border-dashed border-gray-300 text-center text-gray-400">
          Tab content for &quot;{activeTab}&quot;
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ACTION COMPONENTS
// ============================================================================

export interface ActionButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: string;
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function ActionButton({
  label,
  variant = 'primary',
  icon,
  fullWidth = false,
  onClick,
  disabled = false,
  type = 'button',
}: ActionButtonProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = icon
    ? ((LucideIcons as any)[icon] as React.ComponentType<{ className?: string }>)
    : null;

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        variants[variant]
      } ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

export interface AlertBoxProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function AlertBox({
  type = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
}: AlertBoxProps) {
  const [visible, setVisible] = React.useState(true);

  const styles = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: LucideIcons.Info },
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: LucideIcons.CheckCircle },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: LucideIcons.AlertTriangle },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: LucideIcons.XCircle },
  };

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const { bg, border, text, icon: Icon } = styles[type];

  return (
    <div
      className={`${bg} ${border} border rounded-lg p-4 ${!visible ? 'hidden' : ''}`}
      role="alert"
      aria-hidden={!visible}
    >
      <div className="flex">
        <Icon className={`h-5 w-5 ${text} flex-shrink-0`} />
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${text}`}>{title}</h3>
          {message && <p className={`mt-1 text-sm ${text} opacity-80`}>{message}</p>}
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss alert"
            className={`${text} hover:opacity-70`}
          >
            <LucideIcons.X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
