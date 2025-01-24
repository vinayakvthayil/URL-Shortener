import React, { useState, useEffect } from 'react';
import URLForm from '../../URLShortener/URLForm/URLForm';
import ResultCard from '../../URLShortener/ResultCard/ResultCard';
import './Home.css';

const Home = () => {
    const [url, setUrl] = useState('');
    const [urls, setUrls] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUrls();
    }, []);

    const fetchUrls = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/urls');
            const data = await response.json();
            setUrls(data);
        } catch (error) {
            console.error('Error fetching URLs:', error);
            setError('Failed to fetch URLs');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch('http://localhost:5000/api/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ originalUrl: url }),
            });

            if (!response.ok) {
                throw new Error('Failed to shorten URL');
            }

            const data = await response.json();
            setUrls([data, ...urls]);
            setUrl('');
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to shorten URL');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (urlId, customUrl) => {
        try {
            const response = await fetch(`http://localhost:5000/api/url/update/${urlId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ customUrl }),
            });

            if (!response.ok) {
                throw new Error('Failed to update URL');
            }

            const data = await response.json();
            setUrls(currentUrls =>
                currentUrls.map(url =>
                    url._id === urlId ? data : url
                )
            );
        } catch (error) {
            console.error('Update error:', error);
            setError('Failed to update URL');
        }
    };

    const handleDelete = async (urlId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/url/${urlId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete URL');
            }

            setUrls(currentUrls => currentUrls.filter(url => url._id !== urlId));
        } catch (error) {
            console.error('Delete error:', error);
            setError('Failed to delete URL');
        }
    };

    return (
        <div className="home-container">
            <div className="content-wrapper">
                <h1 className="title">URL Shortener</h1>
                {error && <div className="error-message">{error}</div>}
                <URLForm 
                    url={url}
                    setUrl={setUrl}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
                <div className="urls-list">
                    {urls.map((urlItem) => (
                        <ResultCard 
                            key={urlItem._id}
                            url={urlItem}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
