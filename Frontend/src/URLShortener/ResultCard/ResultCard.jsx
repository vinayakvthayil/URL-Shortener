import React, { useState, useEffect } from 'react';
import './ResultCard.css';

const ResultCard = ({ url, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [customUrl, setCustomUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [clicks, setClicks] = useState(url?.clicks || 0);

    useEffect(() => {
        if (url && url.urlCode) {
            setCustomUrl(url.urlCode);
        }
        if (url && url.clicks) {
            setClicks(url.clicks);
        }
    }, [url]);

    const handleEdit = async () => {
        if (isEditing) {
            try {
                if (!customUrl.match(/^[a-zA-Z0-9-_]+$/)) {
                    setError('Custom URL can only contain letters, numbers, hyphens, and underscores');
                    return;
                }
                
                await onEdit(url._id, customUrl);
                setIsEditing(false);
                setError('');
            } catch (err) {
                setError('Failed to update URL. This alias might be taken.');
            }
        } else {
            setIsEditing(true);
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this URL?')) {
            onDelete(url._id);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url.shortUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            setError('Failed to copy URL');
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCustomUrl(url.urlCode);
        setError('');
    };

    const handleUrlClick = async () => {
        try {
            setClicks(prev => prev + 1);
            window.open(url.shortUrl, '_blank');
        } catch (err) {
            console.error('Error opening URL:', err);
        }
    };

    const formatUrl = (url) => {
        if (!url) return '';
        try {
            const urlObj = new URL(url);
            return urlObj.toString();
        } catch (e) {
            return url;
        }
    };

    if (!url) return null;

    return (
        <div className="result-card">
            <div className="url-info">
                <div className="original-url">
                    <span className="label">Original URL:</span>
                    <a 
                        href={url.originalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="url-text"
                    >
                        {formatUrl(url.originalUrl)}
                    </a>
                </div>
                
                <div className="short-url">
                    <span className="label">Shortened URL:</span>
                    <div className="url-edit-group">
                        {isEditing ? (
                            <div className="edit-container">
                                <input
                                    type="text"
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                    className="url-edit-input"
                                    placeholder="Enter custom alias"
                                />
                                <div className="edit-buttons">
                                    <button 
                                        onClick={handleEdit}
                                        className="edit-button save"
                                    >
                                        Save
                                    </button>
                                    <button 
                                        onClick={handleCancel}
                                        className="cancel-button"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="display-container">
                                <a 
                                    href={url.shortUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleUrlClick}
                                    className="short-url-link"
                                >
                                    {url.shortUrl}
                                </a>
                                <div className="action-buttons">
                                    <button 
                                        onClick={handleEdit}
                                        className="edit-button"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={handleCopy}
                                        className={`copy-button ${copied ? 'copied' : ''}`}
                                    >
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                    <button 
                                        onClick={handleDelete}
                                        className="delete-button"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    {error && <p className="error-message">{error}</p>}
                </div>
                
                <div className="url-stats">
                    <span className="clicks">
                        Clicks: {clicks}
                    </span>
                    <span className="created-at">
                        Created: {new Date(url.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ResultCard;
