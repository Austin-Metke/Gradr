// frontend/src/components/ModelSelector.tsx
import { useState, useEffect } from 'react';
import { api, Provider } from '../services/api';

const OLLAMA_MODELS = [
  'llama3.1:8b',
  'llama3.1:70b',
  'codellama:13b',
  'mistral:7b',
  'mixtral:8x7b',
  'deepseek-coder:6.7b',
];

const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];
const ANTHROPIC_MODELS = ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022'];

export function ModelSelector() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState<string>('ollama');
  const [model, setModel] = useState<string>('llama3.1:8b');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    api.getProviders().then((data) => setProviders(data.providers));
    api.getProviderConfig().then((cfg) => {
      if (cfg.provider) {
        setSelected(cfg.provider);
        const models = getModelsForProvider(cfg.provider);
        if (cfg.model && models.includes(cfg.model)) {
          setModel(cfg.model);
        } else if (models.length) {
          setModel(models[0]);
        }
      }
    });
    checkOllama();
  }, []);

  const checkOllama = async () => {
    try {
      const res = await fetch('http://localhost:11434/api/tags');
      if (res.ok) {
        setOllamaStatus('online');
      } else {
        setOllamaStatus('offline');
      }
    } catch {
      setOllamaStatus('offline');
    }
  };

  const getModelsForProvider = (providerId: string): string[] => {
    switch (providerId) {
      case 'ollama': return OLLAMA_MODELS;
      case 'openai': return OPENAI_MODELS;
      case 'anthropic': return ANTHROPIC_MODELS;
      case 'openrouter': return [...ANTHROPIC_MODELS, ...OPENAI_MODELS];
      default: return [];
    }
  };

  const handleProviderChange = (providerId: string) => {
    setSelected(providerId);
    const models = getModelsForProvider(providerId);
    setModel(models[0] || '');
  };

  const handleSave = async () => {
    // Save API key to env/config if provided
    if (apiKeys[selected]) {
      localStorage.setItem(`${selected}_api_key`, apiKeys[selected]);
    }
    await api.setProvider(selected, model);
  };

  return (
    <div className="model-selector p-4 bg-slate-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">LLM Provider</h3>
      
      <div className="space-y-4">
        {/* Provider Selection */}
        <div className="grid grid-cols-2 gap-2">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => handleProviderChange(p.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selected === p.id
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{p.name}</span>
                {p.id === 'ollama' && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    ollamaStatus === 'online' ? 'bg-green-500/30 text-green-400' :
                    ollamaStatus === 'offline' ? 'bg-red-500/30 text-red-400' :
                    'bg-yellow-500/30 text-yellow-400'
                  }`}>
                    {ollamaStatus}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {p.requires_key ? 'API key required' : 'Free / Local'}
              </span>
            </button>
          ))}
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
          >
            {getModelsForProvider(selected).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* API Key Input (if required) */}
        {providers.find((p) => p.id === selected)?.requires_key && (
          <div>
            <label className="block text-sm text-slate-400 mb-1">API Key</label>
            <input
              type="password"
              value={apiKeys[selected] || ''}
              onChange={(e) => setApiKeys({ ...apiKeys, [selected]: e.target.value })}
              placeholder="sk-..."
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}