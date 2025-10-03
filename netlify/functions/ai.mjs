// netlify/functions/ai.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    console.log('=== Function Called ===');
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        if (!process.env.OPENROUTER_API_KEY) {
            console.error('ERROR: OPENROUTER_API_KEY not set');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Server configuration error: API key missing' })
            };
        }

        if (!event.body) {
            console.error('ERROR: No request body');
            return { 
                statusCode: 400, 
                headers,
                body: JSON.stringify({ error: 'Missing request body' }) 
            };
        }

        const { message, context: docContext, temperature, max_tokens } = JSON.parse(event.body);

        // Use environment variable for model name
        const modelName = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';
        
        console.log('Calling OpenRouter API with model:', modelName);
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelName, // Use variable instead of hardcoded string
                messages: [
                    { role: 'system', content: 'You are a helpful study assistant.' },
                    { role: 'user', content: `Context: ${docContext}\n\nQuestion: ${message}` }
                ],
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 800
            })
        });

        console.log('OpenRouter response status:', response.status);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`OpenRouter API Error ${response.status}:`, errorBody);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: `AI API failed with status ${response.status}`,
                    details: errorBody 
                })
            };
        }

        const data = await response.json();

        if (!data?.choices?.[0]?.message) {
            console.error('Unexpected response structure:', JSON.stringify(data));
            return {
                statusCode: 502,
                headers,
                body: JSON.stringify({ error: 'AI API returned unexpected data structure' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ reply: data.choices[0].message.content })
        };

    } catch (error) {
        console.error('=== FUNCTION ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Function execution failed',
                message: error.message
            })
        };
    }
};