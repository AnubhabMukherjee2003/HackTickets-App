import React, { useEffect, useRef, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonBadge, IonIcon,
} from '@ionic/react';
import { trashOutline, copyOutline } from 'ionicons/icons';
import api from '../services/api';

export interface LogEntry {
  id: number;
  time: string;
  level: 'log' | 'warn' | 'error' | 'info' | 'request' | 'response' | 'apierror';
  msg: string;
}

// Global log store so interceptors can push into it from outside React
const logStore: LogEntry[] = [];
let logCounter = 0;
let pushCallback: ((e: LogEntry) => void) | null = null;

export function addLog(level: LogEntry['level'], msg: string) {
  const entry: LogEntry = {
    id: ++logCounter,
    time: new Date().toLocaleTimeString(),
    level,
    msg,
  };
  logStore.unshift(entry);          // newest first
  if (logStore.length > 200) logStore.pop();
  pushCallback?.(entry);
}

// ── Patch console ─────────────────────────────────────────────────────────────
const _log   = console.log.bind(console);
const _warn  = console.warn.bind(console);
const _error = console.error.bind(console);

console.log   = (...a) => { _log(...a);   addLog('log',   a.map(String).join(' ')); };
console.warn  = (...a) => { _warn(...a);  addLog('warn',  a.map(String).join(' ')); };
console.error = (...a) => { _error(...a); addLog('error', a.map(String).join(' ')); };

// ── Axios interceptors ────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  addLog('request', `➤ ${config.method?.toUpperCase()} ${config.baseURL ?? ''}${config.url}`);
  return config;
});

api.interceptors.response.use(
  (res) => {
    addLog('response', `✔ ${res.status} ${res.config.url}  ${JSON.stringify(res.data).slice(0, 160)}`);
    return res;
  },
  (err) => {
    const status = err.response?.status ?? 'NET';
    const url    = err.config?.url ?? '?';
    const body   = JSON.stringify(err.response?.data ?? err.message).slice(0, 200);
    addLog('apierror', `✘ ${status} ${url}  ${body}`);
    return Promise.reject(err);
  }
);

// ── Component ─────────────────────────────────────────────────────────────────
const levelColor: Record<LogEntry['level'], string> = {
  log:      '#ccc',
  info:     '#64b5f6',
  warn:     '#ffb74d',
  error:    '#ef5350',
  request:  '#81c784',
  response: '#4dd0e1',
  apierror: '#ff5252',
};

const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([...logStore]);
  const contentRef = useRef<HTMLIonContentElement>(null);

  useEffect(() => {
    pushCallback = (entry) => setLogs([entry, ...logStore.slice(1)]);
    // log the API base URL immediately so you can see it
    addLog('info', `API BASE: ${import.meta.env.VITE_API_URL || 'http://localhost:3000 (default)'}`);
    return () => { pushCallback = null; };
  }, []);

  const clear = () => { logStore.length = 0; setLogs([]); };

  const copyAll = () => {
    const text = logs.map(l => `[${l.time}][${l.level}] ${l.msg}`).join('\n');
    navigator.clipboard?.writeText(text);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#1a1a2e', '--color': 'white' } as any}>
          <IonTitle style={{ fontSize: 16 }}>🐛 Debug Console</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={copyAll} title="Copy all">
              <IonIcon icon={copyOutline} style={{ color: '#aaa' }} />
            </IonButton>
            <IonButton onClick={clear} title="Clear">
              <IonIcon icon={trashOutline} style={{ color: '#ff6b6b' }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef} style={{ '--background': '#0d0d0d' } as any}>
        <div style={{ padding: '8px 4px', fontFamily: 'monospace' }}>
          {logs.length === 0 && (
            <p style={{ color: '#555', textAlign: 'center', marginTop: 40, fontSize: 13 }}>
              No logs yet. Open another tab to trigger API calls.
            </p>
          )}
          {logs.map((l) => (
            <div key={l.id} style={{
              borderBottom: '1px solid #1e1e1e',
              padding: '5px 6px',
              display: 'flex',
              gap: 6,
              alignItems: 'flex-start',
            }}>
              <span style={{ color: '#555', fontSize: 10, whiteSpace: 'nowrap', paddingTop: 2 }}>
                {l.time}
              </span>
              <IonBadge style={{
                '--background': levelColor[l.level],
                '--color': '#000',
                fontSize: 9,
                flexShrink: 0,
                textTransform: 'uppercase',
              } as any}>
                {l.level}
              </IonBadge>
              <span style={{
                color: levelColor[l.level],
                fontSize: 11,
                wordBreak: 'break-all',
                lineHeight: 1.4,
              }}>
                {l.msg}
              </span>
            </div>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DebugConsole;
