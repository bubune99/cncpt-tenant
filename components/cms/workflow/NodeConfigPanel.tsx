'use client';

/**
 * Node Configuration Panel
 *
 * Panel for configuring selected workflow nodes
 */

import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import type { WorkflowNode, PrimitiveNodeData, TriggerNodeData, ConditionNodeData, OutputNodeData } from './types';

interface NodeConfigPanelProps {
  node: WorkflowNode;
  onUpdate: (nodeId: string, data: unknown) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export default function NodeConfigPanel({
  node,
  onUpdate,
  onDelete,
  onClose,
}: NodeConfigPanelProps) {
  // Local state for editing
  const [localData, setLocalData] = useState<unknown>(node.data);

  // Reset when node changes
  useEffect(() => {
    setLocalData(node.data);
  }, [node.id, node.data]);

  const handleSave = () => {
    onUpdate(node.id, localData);
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this node?')) {
      onDelete(node.id);
      onClose();
    }
  };

  const renderPrimitiveConfig = (data: PrimitiveNodeData) => {
    const schema = data.inputSchema as {
      properties?: Record<string, { type?: string; description?: string; default?: unknown; enum?: string[] }>;
      required?: string[];
    };
    const properties = schema?.properties || {};

    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Primitive</h4>
          <p className="text-sm text-gray-900">{data.primitiveName}</p>
          {data.description && (
            <p className="text-xs text-gray-500 mt-1">{data.description}</p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Input Configuration</h4>
          <div className="space-y-3">
            {Object.entries(properties).map(([key, prop]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {key}
                  {schema.required?.includes(key) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {prop.description && (
                  <p className="text-xs text-gray-400 mb-1">{prop.description}</p>
                )}
                {prop.enum ? (
                  <select
                    value={(data.config[key] as string) || ''}
                    onChange={e =>
                      setLocalData({
                        ...data,
                        config: { ...data.config, [key]: e.target.value },
                        isConfigured: true,
                      })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    {prop.enum.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : prop.type === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={(data.config[key] as boolean) || false}
                    onChange={e =>
                      setLocalData({
                        ...data,
                        config: { ...data.config, [key]: e.target.checked },
                        isConfigured: true,
                      })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                ) : prop.type === 'number' ? (
                  <input
                    type="number"
                    value={(data.config[key] as number) ?? ''}
                    onChange={e =>
                      setLocalData({
                        ...data,
                        config: { ...data.config, [key]: parseFloat(e.target.value) || 0 },
                        isConfigured: true,
                      })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : prop.type === 'object' || prop.type === 'array' ? (
                  <textarea
                    value={
                      typeof data.config[key] === 'string'
                        ? (data.config[key] as string)
                        : JSON.stringify(data.config[key] || '', null, 2)
                    }
                    placeholder={`Enter ${prop.type} as JSON`}
                    onChange={e => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setLocalData({
                          ...data,
                          config: { ...data.config, [key]: parsed },
                          isConfigured: true,
                        });
                      } catch {
                        setLocalData({
                          ...data,
                          config: { ...data.config, [key]: e.target.value },
                        });
                      }
                    }}
                    rows={3}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={(data.config[key] as string) || ''}
                    placeholder={prop.default ? `Default: ${prop.default}` : ''}
                    onChange={e =>
                      setLocalData({
                        ...data,
                        config: { ...data.config, [key]: e.target.value },
                        isConfigured: true,
                      })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
            {Object.keys(properties).length === 0 && (
              <p className="text-xs text-gray-500 italic">No configuration needed</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTriggerConfig = (data: TriggerNodeData) => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Trigger Name</label>
        <input
          type="text"
          value={data.name}
          onChange={e => setLocalData({ ...data, name: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {data.triggerType === 'schedule' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Cron Expression
          </label>
          <input
            type="text"
            value={data.config.schedule || ''}
            placeholder="0 0 * * * (every hour)"
            onChange={e =>
              setLocalData({ ...data, config: { ...data.config, schedule: e.target.value } })
            }
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Format: minute hour day month weekday
          </p>
        </div>
      )}

      {data.triggerType === 'webhook' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Webhook Path
          </label>
          <input
            type="text"
            value={data.config.webhookPath || ''}
            placeholder="/api/webhook/my-workflow"
            onChange={e =>
              setLocalData({ ...data, config: { ...data.config, webhookPath: e.target.value } })
            }
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {data.triggerType === 'event' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Event Type
          </label>
          <select
            value={data.config.eventType || ''}
            onChange={e =>
              setLocalData({ ...data, config: { ...data.config, eventType: e.target.value } })
            }
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select event...</option>
            <option value="user.created">user.created</option>
            <option value="user.updated">user.updated</option>
            <option value="content.published">content.published</option>
            <option value="content.updated">content.updated</option>
            <option value="email.sent">email.sent</option>
            <option value="email.opened">email.opened</option>
          </select>
        </div>
      )}
    </div>
  );

  const renderConditionConfig = (data: ConditionNodeData) => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Condition Name</label>
        <input
          type="text"
          value={data.name}
          onChange={e => setLocalData({ ...data, name: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Expression <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.expression}
          placeholder="data.value > 10"
          onChange={e => setLocalData({ ...data, expression: e.target.value })}
          rows={3}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          JavaScript expression that evaluates to true/false
        </p>
      </div>
    </div>
  );

  const renderOutputConfig = (data: OutputNodeData) => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Output Name</label>
        <input
          type="text"
          value={data.name}
          onChange={e => setLocalData({ ...data, name: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {(data.outputType === 'store' || data.outputType === 'notify') && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Destination
          </label>
          <input
            type="text"
            value={data.config.destination || ''}
            placeholder={data.outputType === 'store' ? 'Table or collection name' : 'Email or channel'}
            onChange={e =>
              setLocalData({ ...data, config: { ...data.config, destination: e.target.value } })
            }
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {data.outputType === 'log' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Format
          </label>
          <select
            value={data.config.format || 'json'}
            onChange={e =>
              setLocalData({ ...data, config: { ...data.config, format: e.target.value } })
            }
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="json">JSON</option>
            <option value="text">Plain Text</option>
            <option value="csv">CSV</option>
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Configure {node.type?.charAt(0).toUpperCase() + node.type?.slice(1)}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {node.type === 'primitive' && renderPrimitiveConfig(localData as PrimitiveNodeData)}
        {node.type === 'trigger' && renderTriggerConfig(localData as TriggerNodeData)}
        {node.type === 'condition' && renderConditionConfig(localData as ConditionNodeData)}
        {node.type === 'output' && renderOutputConfig(localData as OutputNodeData)}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
      </div>
    </div>
  );
}
