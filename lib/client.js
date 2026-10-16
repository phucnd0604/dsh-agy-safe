window.__ModuleLoader__.load({
  id: "dsh-agy-safe",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var react = require("react");

var inject = ['slots'];
function apply(ctx) {
    // @ts-ignore
    const reactModule = typeof window !== 'undefined' && window.React ? window.React : (typeof react !== 'undefined' ? react : null);
    function AgySection() {
        if (!reactModule) {
            return null;
        }
        const [status, setStatus] = reactModule.useState(null);
        const [loading, setLoading] = reactModule.useState(false);
        const [verifying, setVerifying] = reactModule.useState(false);
        const [message, setMessage] = reactModule.useState('');
        const loadStatus = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/dsh-agy/status');
                const json = await res.json();
                if (json.ok) {
                    setStatus(json.value);
                }
            }
            catch (err) {
                setMessage('Cannot reach the host API: ' + (err.message || String(err)));
            }
            finally {
                setLoading(false);
            }
        };
        reactModule.useEffect(() => {
            loadStatus();
            const timer = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    loadStatus();
                }
            }, 10_000);
            return () => clearInterval(timer);
        }, []);
        const handleLogin = async () => {
            setMessage('');
            try {
                const res = await fetch('/api/dsh-agy/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                });
                const json = await res.json();
                if (json.ok && json.value?.started) {
                    setMessage('A system terminal was opened on the desktop — finish the Antigravity login there.');
                }
                else {
                    setMessage('Could not open a terminal automatically — run agy in a terminal yourself to log in.');
                }
            }
            catch (err) {
                setMessage('Failed to launch the login terminal: ' + (err.message || String(err)));
            }
        };
        const handleVerify = async () => {
            setVerifying(true);
            setMessage('Sending a verification request to Antigravity CLI...');
            try {
                const res = await fetch('/api/dsh-agy/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                });
                const json = await res.json();
                if (json.ok && json.value?.authenticated) {
                    setMessage('Credentials verified — Antigravity CLI models are usable.');
                    loadStatus();
                }
                else {
                    setMessage('Credential verification failed: ' + (json.value?.error || 'not logged in, or the session has expired'));
                }
            }
            catch (err) {
                setMessage('Verification call failed: ' + (err.message || String(err)));
            }
            finally {
                setVerifying(false);
            }
        };
        const e = reactModule.createElement;
        return e('div', {
            style: {
                padding: '20px',
                maxWidth: '720px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            },
        }, e('h2', { style: { margin: 0, fontSize: '18px', fontWeight: 600 } }, 'Antigravity CLI (agy) provider settings'), e('p', { style: { margin: 0, color: 'var(--dsw-alias-label-secondary, #666)', fontSize: '13px', lineHeight: 1.6 } }, 'Use the Antigravity CLI (agy) headless session logged in on this machine as a DeepSeek Harness model backend, shared by the main conversation and subagents.'), status &&
            e('div', {
                style: {
                    background: 'var(--dsw-alias-bg-layer-2, #f5f5f5)',
                    border: '1px solid var(--dsw-alias-border-l2, #e0e0e0)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '13px',
                },
            }, e('div', { style: { display: 'flex', justifyContent: 'space-between' } }, e('span', { style: { color: 'var(--dsw-alias-label-secondary, #666)' } }, 'Install status'), e('strong', { style: { color: status.installed ? 'var(--dsw-alias-label-success, #2e7d32)' : 'var(--dsw-alias-label-danger, #d32f2f)' } }, status.installed ? `Installed (${status.version || 'version unknown'})` : 'agy not found')), e('div', { style: { display: 'flex', justifyContent: 'space-between' } }, e('span', { style: { color: 'var(--dsw-alias-label-secondary, #666)' } }, 'Binary path'), e('code', { style: { fontSize: '12px' } }, status.agyPath || 'agy')), e('div', { style: { display: 'flex', justifyContent: 'space-between' } }, e('span', { style: { color: 'var(--dsw-alias-label-secondary, #666)' } }, 'Scratch directory'), e('code', { style: { fontSize: '12px' } }, status.scratchDir)), e('div', { style: { display: 'flex', justifyContent: 'space-between' } }, e('span', { style: { color: 'var(--dsw-alias-label-secondary, #666)' } }, 'Local credentials'), e('span', {}, status.hasCachedAuth ? 'Credential directory found (~/.gemini)' : 'No credentials found'))), e('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' } }, e('button', {
            onClick: handleLogin,
            style: {
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'var(--dsw-alias-button-info-fill, #1976d2)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '13px',
            },
        }, 'Open login terminal'), e('button', {
            onClick: handleVerify,
            disabled: verifying,
            style: {
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'var(--dsw-alias-bg-layer-2, #f0f0f0)',
                color: 'var(--dsw-alias-label-primary, #333)',
                border: '1px solid var(--dsw-alias-border-l2, #ccc)',
                cursor: verifying ? 'wait' : 'pointer',
                fontSize: '13px',
            },
        }, verifying ? 'Verifying...' : 'Verify credentials'), e('button', {
            onClick: loadStatus,
            disabled: loading,
            style: {
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'transparent',
                color: 'var(--dsw-alias-label-secondary, #666)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
            },
        }, loading ? 'Refreshing...' : 'Refresh status')), message &&
            e('div', {
                style: {
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'var(--dsw-alias-bg-layer-2, #f9f9f9)',
                    borderLeft: '4px solid var(--dsw-alias-button-info-fill, #1976d2)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                },
            }, message));
    }
    ctx.slots.inject('settings.section', () => {
        ctx.slots.register({
            name: 'settings.section',
            id: 'agy',
            order: 45,
            label: () => 'Antigravity CLI',
        }, AgySection);
    });
}


    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
