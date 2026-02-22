import { useState } from 'react';
import { Share2, FileText, Check, Copy, RefreshCw, Hexagon } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function ShareText() {
    const [text, setText] = useState('');
    const [loading, setLoading] = [useState(false)[0], useState(false)[1]]; // Quick workaround without custom hook abstraction
    const [code, setCode] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const _setLoading = useState(false)[1];
    const _loading = useState(false)[0];


    // Fixing simple loading state
    const [isLoading, setIsLoading] = useState(false);

    const handleShare = async () => {
        if (!text.trim()) {
            setError('Please enter some text to share.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setCode(null);
        setCopied(false);

        try {
            const response = await fetch(`${API_BASE}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate code');
            }

            setCode(data.code);
            setText(''); // clear input on success somewhat
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (code) {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleNew = () => {
        setCode(null);
        setText('');
        setError(null);
        setCopied(false);
    }

    return (
        <div className="glass-panel">
            <div className="panel-header">
                <Share2 color="#8b5cf6" size={28} />
                <h2>Share Snippet</h2>
            </div>

            {!code ? (
                <div className="input-group">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste your text or code snippet here..."
                        disabled={isLoading}
                    />
                    {error && <div className="text-error">{error}</div>}
                    <button className="btn btn-primary w-full" onClick={handleShare} disabled={isLoading || !text.trim()}>
                        {isLoading ? <span className="loader"></span> : 'Generate Secure Code'}
                    </button>
                </div>
            ) : (
                <div className="result-box">
                    <Hexagon color="#ec4899" size={40} style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Your unique short code is ready!</p>
                    <div className="code-display">{code}</div>

                    <div className="flex-row" style={{ marginTop: '1.5rem' }}>
                        <button className={`btn w-full ${copied ? 'btn-secondary' : 'btn-primary'}`} style={copied ? { borderColor: 'var(--success)', color: 'var(--success)' } : {}} onClick={copyToClipboard}>
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                            {copied ? 'Code Copied!' : 'Copy Code'}
                        </button>
                        <button className="btn btn-secondary w-full" onClick={handleNew}>
                            <RefreshCw size={20} />
                            Share Another
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ShareText;
