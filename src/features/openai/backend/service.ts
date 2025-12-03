import OpenAI from 'openai';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import { OPENAI_ERROR_CODES, type OpenAIErrorCode } from './error';
import type { IssuesResponse, TopicsResponse, AnalysisResponse } from './schema';

const MODEL = 'gpt-4o';
const MAX_RETRIES = 3;

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('[OpenAI] Initializing client, API key exists:', !!apiKey);
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

async function callOpenAIWithRetry<T>(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  parseResponse: (content: string) => T
): Promise<HandlerResult<T, OpenAIErrorCode>> {
  let lastError: Error | null = null;

  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.error('[OpenAI] API key is not configured');
    return failure(502, OPENAI_ERROR_CODES.API_ERROR, 'OpenAI API key is not configured');
  }

  const openai = getOpenAIClient();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[OpenAI] Attempt ${attempt + 1}/${MAX_RETRIES}`);

      const response = await openai.chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        console.error('[OpenAI] Empty response received');
        return failure(502, OPENAI_ERROR_CODES.API_ERROR, 'Empty response from OpenAI');
      }

      try {
        const parsed = parseResponse(content);
        console.log('[OpenAI] Successfully parsed response');
        return success(parsed);
      } catch (parseErr) {
        console.error('[OpenAI] Parse error:', parseErr);
        return failure(502, OPENAI_ERROR_CODES.PARSE_ERROR, 'Failed to parse OpenAI response');
      }
    } catch (err) {
      lastError = err as Error;
      console.error(`[OpenAI] Error on attempt ${attempt + 1}:`, lastError.message);

      if (err instanceof OpenAI.RateLimitError) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[OpenAI] Rate limited, waiting ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (err instanceof OpenAI.APIError) {
        console.error(`[OpenAI] API Error - Status: ${err.status}, Message: ${err.message}`);
        if (err.status === 429) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
      }

      break;
    }
  }

  const errorMessage = lastError?.message || 'Failed to call OpenAI API';
  console.error('[OpenAI] Final error:', errorMessage);

  return failure(
    502,
    OPENAI_ERROR_CODES.API_ERROR,
    errorMessage
  );
}

export async function generatePolicyIssues(
  country: string,
  interest: string
): Promise<HandlerResult<IssuesResponse, OpenAIErrorCode>> {
  const systemPrompt = `You are an expert policy analyst specializing in capstone project topic generation for graduate students. Your task is to identify key policy issues based on the user's country of interest and their area of interest.

For each policy issue, provide:
1. A clear, concise issue title
2. An importance score (1-10) based on policy relevance and urgency
3. A frequency score (1-10) based on how often this topic appears in academic and policy discussions
4. A total score (sum of importance and frequency)

Return your response as a JSON object with the following structure:
{
  "policy_issues": [
    {
      "issue": "Issue title here",
      "importance_score": 8.5,
      "frequency_score": 7.0,
      "total_score": 15.5
    }
  ]
}

Generate exactly 10 policy issues, sorted by total_score in descending order.`;

  const userPrompt = `Country: ${country}
Area of Interest: ${interest}

Please generate 10 relevant policy issues for a capstone project that a graduate student could research. The issues should be:
1. Specific to the country mentioned
2. Related to the area of interest
3. Feasible for academic research
4. Relevant to current policy discussions`;

  return callOpenAIWithRetry<IssuesResponse>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    (content) => {
      const parsed = JSON.parse(content);
      if (!parsed.policy_issues || !Array.isArray(parsed.policy_issues)) {
        throw new Error('Invalid response structure');
      }
      return parsed as IssuesResponse;
    }
  );
}

export async function generateTopics(
  country: string,
  issue: string,
  existingTopics: string[] = []
): Promise<HandlerResult<TopicsResponse, OpenAIErrorCode>> {
  const systemPrompt = `You are an expert academic advisor specializing in capstone project topic generation for graduate students. Your task is to generate specific, researchable capstone project topics based on a policy issue.

Return your response as a JSON object with the following structure:
{
  "topics": [
    { "title": "Specific research topic title here" }
  ]
}

Generate exactly 5 unique topics. Each topic should be:
1. Specific and focused enough for a capstone project
2. Researchable with available data and methods
3. Relevant to policy discussions in the specified country
4. Original and not a duplicate of existing topics`;

  let userPrompt = `Country: ${country}
Policy Issue: ${issue}

Please generate 5 specific capstone project topics that a graduate student could research.`;

  if (existingTopics.length > 0) {
    userPrompt += `\n\nPlease avoid the following topics that have already been suggested:\n${existingTopics.map((t) => `- ${t}`).join('\n')}`;
  }

  return callOpenAIWithRetry<TopicsResponse>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    (content) => {
      const parsed = JSON.parse(content);
      if (!parsed.topics || !Array.isArray(parsed.topics)) {
        throw new Error('Invalid response structure');
      }
      return parsed as TopicsResponse;
    }
  );
}

export async function generateAnalysis(
  country: string,
  issue: string,
  topicTitle: string
): Promise<HandlerResult<AnalysisResponse, OpenAIErrorCode>> {
  const systemPrompt = `You are an expert academic advisor providing detailed analysis for a capstone project topic. Provide comprehensive guidance including rationale, methodology, data sources, and key references.

Return your response as a JSON object with the following structure:
{
  "rationale": {
    "relevance": "Explanation of topic relevance to current policy discussions...",
    "feasibility": "Assessment of research feasibility including data availability and methodology...",
    "impact": "Potential impact of the research on policy and practice..."
  },
  "data_sources": [
    "Data source 1 with description",
    "Data source 2 with description"
  ],
  "key_references": [
    "Author (Year). Title. Journal/Publisher.",
    "Author (Year). Title. Journal/Publisher."
  ],
  "methodologies": [
    {
      "methodology": "Methodology name",
      "explanation": "How this methodology applies to the research..."
    }
  ],
  "policy_questions": [
    "Research question 1?",
    "Research question 2?"
  ]
}

Provide:
- 5-8 potential data sources (real, verifiable sources preferred)
- 5-8 key references (real academic papers and reports when possible)
- 3-5 recommended methodologies
- 5 key policy questions`;

  const userPrompt = `Country: ${country}
Policy Issue: ${issue}
Capstone Topic: ${topicTitle}

Please provide a detailed analysis of this capstone project topic.`;

  return callOpenAIWithRetry<AnalysisResponse>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    (content) => {
      const parsed = JSON.parse(content);
      if (!parsed.rationale || !parsed.data_sources || !parsed.methodologies) {
        throw new Error('Invalid response structure');
      }
      return parsed as AnalysisResponse;
    }
  );
}
