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
  const [saved, setSaved] = useState(false);

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
    setSaved(false);
  };

  const handleSave = async () => {
    // Save API key to env/config if provided
    if (apiKeys[selected]) {
      localStorage.setItem(`${selected}_api_key`, apiKeys[selected]);
    }
    await api.setProvider(selected, model);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getProviderIcon = (id: string) => {
    switch (id) {
      case 'ollama':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        );
      case 'openai':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.28 9.64a5.64 5.64 0 0 0-.49-4.63 5.7 5.7 0 0 0-6.14-2.73 5.64 5.64 0 0 0-4.25-1.88 5.7 5.7 0 0 0-5.43 3.95 5.64 5.64 0 0 0-3.77 2.75 5.7 5.7 0 0 0 .7 6.68 5.64 5.64 0 0 0 .49 4.63 5.7 5.7 0 0 0 6.14 2.73 5.64 5.64 0 0 0 4.25 1.88 5.7 5.7 0 0 0 5.43-3.95 5.64 5.64 0 0 0 3.77-2.75 5.7 5.7 0 0 0-.7-6.68z" />
          </svg>
        );
      case 'anthropic':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22h20L12 2zm0 5l6 13H6l6-13z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div className="grid grid-cols-2 gap-2">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => handleProviderChange(p.id)}
            className={`p-3 rounded-xl border-2 transition-all text-left ${
              selected === p.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700/50 hover:border-slate-600 bg-slate-800/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`${selected === p.id ? 'text-blue-400' : 'text-slate-400'}`}>
                {getProviderIcon(p.id)}
              </span>
              <span className={`text-sm font-medium ${selected === p.id ? 'text-white' : 'text-slate-300'}`}>
                {p.name.split(' ')[0]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {p.id === 'ollama' && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  ollamaStatus === 'online' ? 'bg-green-500/20 text-green-400' :
                  ollamaStatus === 'offline' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {ollamaStatus}
                </span>
              )}
              {p.requires_key && (
                <span className="text-xs text-slate-500">
                  API key
                </span>
              )}
              {!p.requires_key && p.id !== 'ollama' && (
                <span className="text-xs text-slate-500">
                  Free
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Model</label>
        <select
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            setSaved(false);
          }}
          className="w-full p-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        >
          {getModelsForProvider(selected).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* API Key Input (if required) */}
      {providers.find((p) => p.id === selected)?.requires_key && (
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">API Key</label>
          <input
            type="password"
            value={apiKeys[selected] || ''}
            onChange={(e) => {
              setApiKeys({ ...apiKeys, [selected]: e.target.value });
              setSaved(false);
            }}
            placeholder="sk-..."
            className="w-full p-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          />
        </div>
      )}

      <button
        onClick={handleSave}
        className={`w-full p-2.5 rounded-lg text-white text-sm font-medium transition-all ${
          saved 
            ? 'bg-green-600' 
            : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        {saved ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved!
          </span>
        ) : 'Save Configuration'}
      </button>
    </div>
  );
}