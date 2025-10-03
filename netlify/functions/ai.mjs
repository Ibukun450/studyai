// netlify/functions/ai.js - Recommended robust version
const fetch = require('node-fetch'); // Use CommonJS

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { message, context: docContext, temperature, max_tokens } = JSON.parse(event.body);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                // Ensure OPENROUTER_API_KEY is set in Netlify Environment Variables!
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [
                    { role: 'system', content: 'You are a helpful study assistant.' },
                    { role: 'user', content: `Context: ${docContext}\n\nQuestion: ${message}` }
                ],
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 800
            })
        });

        // CRITICAL CHECK: Handle non-200 responses from the external API
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`OpenRouter API Error ${response.status}: ${errorBody}`);
            
            // Return the actual error status
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `AI API failed with status ${response.status}. Check Netlify logs for details.`, details: errorBody })
            };
        }

        const data = await response.json();

        // FINAL CHECK: Ensure the expected response path exists
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
        // This catches parsing errors or actual network failures
        console.error("Function execution error:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Function failed: ${error.message}` })
        };
    }
};