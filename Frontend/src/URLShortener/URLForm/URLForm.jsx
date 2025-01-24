import React, { useState } from 'react';
import './URLForm.css';

const URLForm = ({ url, setUrl, onSubmit, isLoading }) => {
    const [customAlias, setCustomAlias] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isValidUrl(url)) {
            setError('Please enter a valid URL');
            return;
        }

        try {
            await onSubmit(e, customAlias);
            setCustomAlias('');
        } catch (error) {
            setError('Failed to shorten URL. Please try again.');
        }
    };

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    return (
        <div className="url-form-container">
            <form onSubmit={handleSubmit} className="url-form">
                <div className="input-group">
                    <input
                        type="url"
                        placeholder="Enter your URL here (e.g., https://example.com)"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                        className="url-input"
                    />
                    <input
                        type="text"
                        placeholder="Custom alias (optional)"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value)}
                        className="alias-input"
                        pattern="[a-zA-Z0-9-_]+"
                        title="Only letters, numbers, hyphens, and underscores are allowed"
                    />
                </div>
                {error && <div className="error-message">{error}</div>}
                <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isLoading || !url}
                >
                    {isLoading ? (
                        <span className="loading-text">
                            <span className="spinner"></span>
                            Shortening...
                        </span>
                    ) : (
                        'Shorten URL'
                    )}
                </button>
            </form>
        </div>
    );
};

export default URLForm;
