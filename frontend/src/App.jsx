import { useState } from 'react';
import ShareText from './components/ShareText';
import RetrieveText from './components/RetrieveText';

function App() {
  const [activeTab, setActiveTab] = useState('share'); // 'share' or 'retrieve'

  return (
    <>
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <div className="app-container">
        <header>
          <h1>Text<span style={{ color: 'var(--text-main)' }}>Share</span></h1>
          <p>Securely share text snippets with a simple short code.</p>
        </header>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
          <button
            className={`btn ${activeTab === 'share' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('share')}
            style={{ borderRadius: '24px', padding: '0.5rem 1.5rem' }}
          >
            Share Text
          </button>
          <button
            className={`btn ${activeTab === 'retrieve' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('retrieve')}
            style={{ borderRadius: '24px', padding: '0.5rem 1.5rem' }}
          >
            Retrieve Text
          </button>
        </div>

        {activeTab === 'share' ? <ShareText /> : <RetrieveText />}
      </div>
    </>
  );
}

export default App;
