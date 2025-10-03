// netlify/functions/ai.js

// Using 'require' for node-fetch is standard CommonJS
// and generally safer in Netlify Functions than 'import'.
const fetch = require('node-fetch'); 

// The 'exports.handler' structure is the standard for CommonJS Netlify Functions.
exports.handler = async (event, context) => {
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 1. INPUT PARSING
        // Check for empty body before parsing
        if (!event.body) {
             return { statusCode: 400, body: JSON.stringify({ error: 'Missing request body.' }) };
        }
        const { message, context: docContext, temperature, max_tokens } = JSON.parse(event.body);

        // 2. EXTERNAL API CALL
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                // IMPORTANT: Ensure OPENROUTER_API_KEY is set in Netlify Environment Variables!
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // Note: Hardcoding the model here avoids the previous secrets scanning failure.
                model: 'google/gemini-2.0-flash-exp:free', 
                messages: [
                    { role: 'system', content: 'You are a helpful study assistant.' },
                    { role: 'user', content: `Context: ${docContext}\n\nQuestion: ${message}` }
                ],
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 800
            })
        });

        // 3. CRITICAL CHECK: Handle non-200 responses from the external API
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`OpenRouter API Error ${response.status}: ${errorBody}`);
            
            // Return the actual error status (e.g., 401 for bad API key)
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `AI API failed with status ${response.status}.`, details: errorBody })
            };
        }

        // 4. PROCESS RESPONSE
        const data = await response.json();

        // 5. FINAL CHECK: Ensure the expected response path exists
        // Check for the response structure expected from the chat completion endpoint
        if (!data || !data.choices || data.choices.length === 0 || !data.choices[0].message) {
             const errorDetails = JSON.stringify(data);
             console.error("Unexpected API response structure:", errorDetails);
             return {
                statusCode: 502, // Bad Gateway/Unexpected upstream response
                body: JSON.stringify({ error: "AI API returned an unexpected data structure.", details: errorDetails })
            };
        }


        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ reply: data.choices[0].message.content })
        };
    } catch (error) {
        // This catches JSON.parse errors, network failures, or other unexpected crashes
        console.error("Function execution error:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Function execution failed: ${error.message}` })
        };
    }
};