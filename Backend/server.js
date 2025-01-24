const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const shortid = require('shortid');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    retryWrites: true,
    w: 'majority'
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// URL Schema
const urlSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    shortUrl: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    urlCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    clicks: {
        type: Number,
        default: 0,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    lastAccessed: {
        type: Date,
        index: true
    }
});

const Url = mongoose.model('Url', urlSchema);

// Create short URL
app.post('/api/shorten', async (req, res) => {
    const { originalUrl } = req.body;

    try {
        if (!originalUrl) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL format
        try {
            new URL(originalUrl);
        } catch (err) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        let url = await Url.findOne({ originalUrl });
        if (url) {
            return res.json(url);
        }

        // Create TinyURL
        const tinyUrlResponse = await fetch('https://api.tinyurl.com/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.TINYURL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: originalUrl,
                domain: "tinyurl.com"
            })
        });

        const tinyUrlData = await tinyUrlResponse.json();

        if (!tinyUrlData.data || !tinyUrlData.data.tiny_url) {
            throw new Error('Failed to create TinyURL');
        }

        const urlCode = shortid.generate();
        
        url = new Url({
            originalUrl,
            shortUrl: tinyUrlData.data.tiny_url,
            urlCode,
            createdAt: new Date()
        });

        await url.save();
        res.json(url);
    } catch (err) {
        console.error('Error creating short URL:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Update URL with custom alias
app.put('/api/url/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { customUrl } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        if (!customUrl) {
            return res.status(400).json({ error: 'Custom URL is required' });
        }

        const existingUrl = await Url.findById(id);
        
        if (!existingUrl) {
            return res.status(404).json({ error: 'URL not found' });
        }

       // Create new TinyURL with custom alias
       const tinyUrlResponse = await fetch('https://api.tinyurl.com/create', {
           method: 'POST',
           headers: {
               'Authorization': `Bearer ${process.env.TINYURL_API_KEY}`,
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({
               url: existingUrl.originalUrl,
               domain: "tinyurl.com",
               alias: customUrl // Use the custom alias provided by the user
           })
       });

       const tinyUrlData = await tinyUrlResponse.json();

       if (!tinyUrlData.data || !tinyUrlData.data.tiny_url) {
           throw new Error('Failed to create custom TinyURL');
       }

       const updatedUrl = await Url.findByIdAndUpdate(
           id,
           { 
               shortUrl: tinyUrlData.data.tiny_url, // Update with the new TinyURL
               urlCode: customUrl, // Update the URL code with the custom alias
               lastAccessed : new Date() // Update last accessed date
           },
           { new : true }
       );

       res.json(updatedUrl);
   } catch (err) {
       console.error('Error updating URL:', err);
       res.status(500).json({ error : 'Server error', details : err.message });
   }
});

// Click tracking endpoint
app.post('/api/url/:id/click', async (req, res) => {
   try {
       const { id } = req.params;

       if (!mongoose.Types.ObjectId.isValid(id)) {
           return res.status(400).json({ error : 'Invalid ID format' });
       }

       const url = await Url.findByIdAndUpdate(
           id,
           { 
               $inc : { clicks : 1 }, 
               lastAccessed : new Date() 
           },
           { new : true }
       );

       if (!url) {
           return res.status(404).json({ error : 'URL not found' });
       }

       res.json({ clicks : url.clicks });
   } catch (err) {
       console.error('Error updating clicks:', err);
       res.status(500).json({ error : 'Server error' });
   }
});

// Get all URLs
app.get('/api/urls', async (req, res) => {
   try {
       const urls = await Url.find().sort({ createdAt : -1 });
       res.json(urls);
   } catch (err) {
       console.error('Error fetching URLs:', err);
       res.status(500).json({ error : 'Server error' });
   }
});

// Delete URL endpoint
app.delete('/api/url/:id', async (req, res) => {
   try {
       const { id } = req.params;

       if (!mongoose.Types.ObjectId.isValid(id)) {
           return res.status(400).json({ error : 'Invalid ID format' });
       }

       const url = await Url.findByIdAndDelete(id);
       
       if (!url) {
           return res.status(404).json({ error : 'URL not found' });
       }

       res.json({ 
           message : 'URL deleted successfully',
           deletedUrl : url // Optionally send back the deleted URL for confirmation.
       });
   } catch (err) {
       console.error('Error deleting URL:', err);
       res.status(500).json({ error : 'Server error' });
   }
});

// Redirect to original URL with click tracking
app.get('/:urlCode', async (req, res) => {
   try {
       const url = await Url.findOneAndUpdate(
           { urlCode : req.params.urlCode },
           { 
               $inc : { clicks : 1 }, 
               lastAccessed : new Date() 
           },
           { new : true }
       );

       if (!url) {
           return res.status(404).json({ error : 'URL not found' });
       }

       res.redirect(url.originalUrl);
   } catch (err) {
       console.error('Error redirecting:', err);
       res.status(500).json({ error : 'Server error' });
   }
});

// Error handling middleware for unexpected errors
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).json({
      error : 'Internal Server Error',
      message : err.message
   });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
