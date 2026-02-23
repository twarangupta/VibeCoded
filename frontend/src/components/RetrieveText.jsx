import { useState } from 'react';
import { DownloadCloud, Check, Copy } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function RetrieveText() {
    const [code, setCode] = useState('');
    const [retrievedText, setRetrievedText] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleRetrieve = async () => {
        if (!code.trim()) {
            setError('Please enter a code to retrieve.');
            return;
        }

        setLoading(true);
        setError(null);
        setRetrievedText(null);
        setCopied(false);

        try {
            const response = await fetch(`${API_BASE}/share/${code.trim()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to retrieve text. Is the code correct?');
            }

            setRetrievedText(data.text);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (retrievedText) {
            navigator.clipboard.writeText(retrievedText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="glass-panel">
            <div className="panel-header">
                <DownloadCloud color="#ec4899" size={28} />
                <h2>Retrieve Snippet</h2>
            </div>

            <div className="input-group">
                <div className="flex-row">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter short code here..."
                        disabled={loading}
                        maxLength={10}
                        style={{ flex: 1 }}
                    />
                    <button className="btn btn-secondary" onClick={handleRetrieve} disabled={loading || !code.trim()}>
                        {loading ? <span className="loader"></span> : 'Fetch Text'}
                    </button>
                </div>

                {error && <div className="text-error">{error}</div>}
            </div>

            {retrievedText && (
                <div className="result-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Retrieved Text:</span>
                        <button
                            className={`btn ${copied ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', ...(copied ? { borderColor: 'var(--success)', color: 'var(--success)' } : {}) }}
                            onClick={copyToClipboard}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <div className="retrieved-text">{retrievedText}</div>
                </div>
            )}
        </div>
    );
}

export default RetrieveText;
