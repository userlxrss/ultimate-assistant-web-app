import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, createNotFoundResponse, handleApiError, validateId } from '@/utils/api-response';
import { OpenAI } from 'openai';

interface RouteParams {
  params: { id: string };
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const POST = withAuth(async (request: NextRequest, { user }: { user: any }) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Get [id] from /api/journal/[id]/reflect

    if (!validateId(id)) {
      return createNotFoundResponse('Journal entry');
    }

    // Get the journal entry
    const journalEntry = await db.journalEntry.findFirst({
      where: {
        id,
        userId: user.id
      },
      select: {
        id: true,
        title: true,
        content: true,
        mood: true,
        tags: true,
        createdAt: true
      }
    });

    if (!journalEntry) {
      return createNotFoundResponse('Journal entry');
    }

    // Generate AI reflection
    const reflection = await generateAIReflection(journalEntry);

    // Update the journal entry with AI reflection
    const updatedEntry = await db.journalEntry.update({
      where: { id },
      data: {
        aiReflection: reflection
      },
      select: {
        id: true,
        title: true,
        content: true,
        mood: true,
        tags: true,
        isPrivate: true,
        aiReflection: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return createSuccessResponse({
      reflection,
      entry: updatedEntry
    });

  } catch (error) {
    return handleApiError(error);
  }
});

async function generateAIReflection(entry: {
  title: string;
  content: string;
  mood?: string | null;
  tags: string[];
  createdAt: Date;
}): Promise<string> {
  const prompt = `As an empathetic AI assistant, provide a thoughtful reflection on this journal entry:

Title: ${entry.title}
Content: ${entry.content}
Mood: ${entry.mood || 'Not specified'}
Tags: ${entry.tags.join(', ')}
Date: ${entry.createdAt.toLocaleDateString()}

Please provide:
1. A brief acknowledgment of the main themes and emotions
2. Gentle insights or perspectives that might be helpful
3. A supportive and encouraging closing thought

Keep your reflection warm, insightful, and around 150-200 words. Focus on emotional intelligence and personal growth.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an empathetic AI assistant specializing in personal reflection and emotional intelligence. Provide thoughtful, supportive insights while respecting the user's privacy and emotional state."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content ||
           "I appreciate you sharing this journal entry. Your thoughts and feelings are valid and important. Taking time to reflect is a valuable practice for personal growth and self-awareness.";
  } catch (error) {
    console.error('Error generating AI reflection:', error);

    // Fallback reflection
    return "I appreciate you sharing this journal entry. Your thoughts and feelings are valid and important. Taking time to reflect is a valuable practice for personal growth and self-awareness. Consider what insights you can gain from this experience and how they might inform your journey forward.";
  }
}