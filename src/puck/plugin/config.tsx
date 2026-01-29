'use client';

/**
 * Plugin UI Puck Configuration
 *
 * Puck configuration for building plugin settings pages, dashboard widgets,
 * and custom admin pages visually.
 */

import type { Config } from '@puckeditor/core';
import {
  StatWidget,
  ChartWidget,
  TableWidget,
  ActivityWidget,
  FormSection,
  TextInputField,
  SelectField,
  ToggleField,
  PageHeader,
  CardContainer,
  GridLayout,
  TabsContainer,
  ActionButton,
  AlertBox,
  type StatWidgetProps,
  type ChartWidgetProps,
  type TableWidgetProps,
  type ActivityWidgetProps,
  type FormSectionProps,
  type TextInputFieldProps,
  type SelectFieldProps,
  type ToggleFieldProps,
  type PageHeaderProps,
  type CardContainerProps,
  type GridLayoutProps,
  type TabsContainerProps,
  type ActionButtonProps,
  type AlertBoxProps,
} from './components';

export type PluginUIComponents = {
  StatWidget: StatWidgetProps;
  ChartWidget: ChartWidgetProps;
  TableWidget: TableWidgetProps;
  ActivityWidget: ActivityWidgetProps;
  FormSection: FormSectionProps;
  TextInputField: TextInputFieldProps;
  SelectField: SelectFieldProps;
  ToggleField: ToggleFieldProps;
  PageHeader: PageHeaderProps;
  CardContainer: CardContainerProps;
  GridLayout: GridLayoutProps;
  TabsContainer: TabsContainerProps;
  ActionButton: ActionButtonProps;
  AlertBox: AlertBoxProps;
};

export const pluginUIPuckConfig: Config<PluginUIComponents> = {
  categories: {
    layout: {
      title: 'Layout',
      components: ['PageHeader', 'CardContainer', 'GridLayout', 'TabsContainer'],
    },
    widgets: {
      title: 'Dashboard Widgets',
      components: ['StatWidget', 'ChartWidget', 'TableWidget', 'ActivityWidget'],
    },
    forms: {
      title: 'Form Elements',
      components: ['FormSection', 'TextInputField', 'SelectField', 'ToggleField'],
    },
    actions: {
      title: 'Actions & Feedback',
      components: ['ActionButton', 'AlertBox'],
    },
  },
  components: {
    // ========== WIDGETS ==========
    StatWidget: {
      label: 'Stat Widget',
      fields: {
        title: { type: 'text', label: 'Title' },
        value: { type: 'text', label: 'Value' },
        change: { type: 'text', label: 'Change Text' },
        changeType: {
          type: 'select',
          label: 'Change Type',
          options: [
            { label: 'Positive', value: 'positive' },
            { label: 'Negative', value: 'negative' },
            { label: 'Neutral', value: 'neutral' },
          ],
        },
        icon: { type: 'text', label: 'Icon Name (Lucide)' },
        backgroundColor: { type: 'text', label: 'Background Color' },
      },
      defaultProps: {
        title: 'Total Users',
        value: '1,234',
        change: '+12% from last month',
        changeType: 'positive',
        icon: 'Users',
        backgroundColor: '#ffffff',
      },
      render: StatWidget,
    },
    ChartWidget: {
      label: 'Chart Widget',
      fields: {
        title: { type: 'text', label: 'Title' },
        chartType: {
          type: 'select',
          label: 'Chart Type',
          options: [
            { label: 'Bar Chart', value: 'bar' },
            { label: 'Line Chart', value: 'line' },
            { label: 'Pie Chart', value: 'pie' },
          ],
        },
        dataSource: { type: 'text', label: 'Data Source (API endpoint)' },
        height: { type: 'number', label: 'Height (px)' },
        backgroundColor: { type: 'text', label: 'Background Color' },
      },
      defaultProps: {
        title: 'Revenue Over Time',
        chartType: 'line',
        dataSource: '',
        height: 200,
        backgroundColor: '#ffffff',
      },
      render: ChartWidget,
    },
    TableWidget: {
      label: 'Table Widget',
      fields: {
        title: { type: 'text', label: 'Title' },
        columns: { type: 'text', label: 'Columns (comma-separated)' },
        dataSource: { type: 'text', label: 'Data Source (API endpoint)' },
        maxRows: { type: 'number', label: 'Max Rows' },
        backgroundColor: { type: 'text', label: 'Background Color' },
      },
      defaultProps: {
        title: 'Recent Orders',
        columns: 'Order ID,Customer,Amount,Status',
        dataSource: '',
        maxRows: 5,
        backgroundColor: '#ffffff',
      },
      render: TableWidget,
    },
    ActivityWidget: {
      label: 'Activity Feed',
      fields: {
        title: { type: 'text', label: 'Title' },
        maxItems: { type: 'number', label: 'Max Items' },
        backgroundColor: { type: 'text', label: 'Background Color' },
      },
      defaultProps: {
        title: 'Recent Activity',
        maxItems: 5,
        backgroundColor: '#ffffff',
      },
      render: ActivityWidget,
    },

    // ========== FORMS ==========
    FormSection: {
      label: 'Form Section',
      fields: {
        title: { type: 'text', label: 'Section Title' },
        description: { type: 'textarea', label: 'Description' },
      },
      defaultProps: {
        title: 'General Settings',
        description: 'Configure the basic settings for this plugin.',
      },
      render: FormSection,
    },
    TextInputField: {
      label: 'Text Input',
      fields: {
        label: { type: 'text', label: 'Label' },
        name: { type: 'text', label: 'Field Name' },
        placeholder: { type: 'text', label: 'Placeholder' },
        helpText: { type: 'text', label: 'Help Text' },
        required: {
          type: 'radio',
          label: 'Required',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        type: {
          type: 'select',
          label: 'Input Type',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'URL', value: 'url' },
            { label: 'Password', value: 'password' },
          ],
        },
      },
      defaultProps: {
        label: 'API Key',
        name: 'apiKey',
        placeholder: 'Enter your API key',
        helpText: 'You can find this in your dashboard settings.',
        required: true,
        type: 'text',
      },
      render: TextInputField,
    },
    SelectField: {
      label: 'Select Dropdown',
      fields: {
        label: { type: 'text', label: 'Label' },
        name: { type: 'text', label: 'Field Name' },
        options: { type: 'text', label: 'Options (comma-separated)' },
        helpText: { type: 'text', label: 'Help Text' },
        required: {
          type: 'radio',
          label: 'Required',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        label: 'Environment',
        name: 'environment',
        options: 'Development,Staging,Production',
        helpText: '',
        required: false,
      },
      render: SelectField,
    },
    ToggleField: {
      label: 'Toggle Switch',
      fields: {
        label: { type: 'text', label: 'Label' },
        name: { type: 'text', label: 'Field Name' },
        description: { type: 'text', label: 'Description' },
        defaultEnabled: {
          type: 'radio',
          label: 'Default State',
          options: [
            { label: 'Enabled', value: true },
            { label: 'Disabled', value: false },
          ],
        },
      },
      defaultProps: {
        label: 'Enable Notifications',
        name: 'enableNotifications',
        description: 'Receive email notifications when events occur.',
        defaultEnabled: false,
      },
      render: ToggleField,
    },

    // ========== LAYOUT ==========
    PageHeader: {
      label: 'Page Header',
      fields: {
        title: { type: 'text', label: 'Title' },
        description: { type: 'textarea', label: 'Description' },
        showBackButton: {
          type: 'radio',
          label: 'Show Back Button',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        title: 'Plugin Settings',
        description: 'Configure your plugin options below.',
        showBackButton: false,
      },
      render: PageHeader,
    },
    CardContainer: {
      label: 'Card Container',
      fields: {
        title: { type: 'text', label: 'Title' },
        padding: { type: 'number', label: 'Padding (px)' },
        backgroundColor: { type: 'text', label: 'Background Color' },
      },
      defaultProps: {
        title: '',
        padding: 16,
        backgroundColor: '#ffffff',
      },
      render: CardContainer,
    },
    GridLayout: {
      label: 'Grid Layout',
      fields: {
        columns: {
          type: 'number',
          label: 'Columns',
          min: 1,
          max: 4,
        },
        gap: { type: 'number', label: 'Gap (px)' },
      },
      defaultProps: {
        columns: 2,
        gap: 16,
      },
      render: GridLayout,
    },
    TabsContainer: {
      label: 'Tabs',
      fields: {
        tabs: { type: 'text', label: 'Tab Names (comma-separated)' },
        defaultTab: { type: 'text', label: 'Default Tab' },
      },
      defaultProps: {
        tabs: 'General,Advanced,API',
        defaultTab: 'General',
      },
      render: TabsContainer,
    },

    // ========== ACTIONS ==========
    ActionButton: {
      label: 'Button',
      fields: {
        label: { type: 'text', label: 'Button Text' },
        variant: {
          type: 'select',
          label: 'Variant',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Danger', value: 'danger' },
          ],
        },
        icon: { type: 'text', label: 'Icon Name (Lucide)' },
        fullWidth: {
          type: 'radio',
          label: 'Full Width',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        label: 'Save Changes',
        variant: 'primary',
        icon: 'Save',
        fullWidth: false,
      },
      render: ActionButton,
    },
    AlertBox: {
      label: 'Alert Box',
      fields: {
        type: {
          type: 'select',
          label: 'Type',
          options: [
            { label: 'Info', value: 'info' },
            { label: 'Success', value: 'success' },
            { label: 'Warning', value: 'warning' },
            { label: 'Error', value: 'error' },
          ],
        },
        title: { type: 'text', label: 'Title' },
        message: { type: 'textarea', label: 'Message' },
        dismissible: {
          type: 'radio',
          label: 'Dismissible',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        type: 'info',
        title: 'Information',
        message: 'This is an informational message.',
        dismissible: false,
      },
      render: AlertBox,
    },
  },
};

export default pluginUIPuckConfig;
