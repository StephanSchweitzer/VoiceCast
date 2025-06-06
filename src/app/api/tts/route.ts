import { NextRequest, NextResponse } from 'next/server';
import { Client } from "@gradio/client";

// Type definitions for Gradio response
interface GradioAudioData {
    url?: string;
    path?: string;
    orig_name?: string;
    size?: number;
}

interface GradioResponse {
    data: GradioAudioData[];
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            text,
            audioSampleUrl,
            exaggeration = 0.5,
            temperature = 0.8,
            seed = 0,
            cfgw = 0.5
        } = body;

        // Validate required fields
        if (!text || !audioSampleUrl) {
            return NextResponse.json(
                { error: 'Text and audio sample URL are required' },
                { status: 400 }
            );
        }

        // Limit text length
        const truncatedText = text.slice(0, 300);

        // Handle relative URLs by converting to absolute URLs
        let fullAudioUrl = audioSampleUrl;
        if (audioSampleUrl.startsWith('/')) {
            // Get the base URL from the request
            const protocol = request.headers.get('x-forwarded-proto') || 'http';
            const host = request.headers.get('host');
            if (!host) {
                return NextResponse.json(
                    { error: 'Unable to determine server host' },
                    { status: 500 }
                );
            }
            fullAudioUrl = `${protocol}://${host}${audioSampleUrl}`;
        }

        console.log('Fetching audio from:', fullAudioUrl);

        // Fetch the reference audio file
        const audioResponse = await fetch(fullAudioUrl);
        if (!audioResponse.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch reference audio' },
                { status: 400 }
            );
        }
        const audioBlob = await audioResponse.blob();

        // Connect to Gradio client
        const client = await Client.connect("ResembleAI/Chatterbox");

        // Make the TTS prediction
        const result = await client.predict("/generate_tts_audio", {
            text_input: truncatedText,
            audio_prompt_path_input: audioBlob,
            exaggeration_input: exaggeration,
            temperature_input: temperature,
            seed_num_input: seed,
            cfgw_input: cfgw,
        }) as GradioResponse;

        console.log('TTS Result:', result.data);

        // The result should contain audio data
        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            const audioData = result.data[0];
            let audioUrl: string;

            if (audioData.url) {
                // If the result has a URL, use it directly
                audioUrl = audioData.url;
            } else if (audioData.path) {
                // If it has a path, construct the URL
                audioUrl = `https://ResembleAI-Chatterbox.hf.space/file=${audioData.path}`;
            } else {
                return NextResponse.json(
                    { error: 'No audio URL found in response' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                audioUrl: audioUrl,
                originalText: truncatedText
            });
        } else {
            return NextResponse.json(
                { error: 'No audio data received from the API' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('TTS API Error:', error);

        let errorMessage = 'Failed to generate speech';
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}