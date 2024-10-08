import { NextResponse } from 'next/server';
import twilio from 'twilio';
import OpenAI from 'openai';
import { getCurrentDateTime } from '../utils/dateTime';
import { getExchangeRate } from '../utils/exchangeRate';
import { addLead, checkAndAddMeeting, getCalendarEvents, getCalendarEventsForRooms } from '../utils/bitrix';
import { authorizeWhatsAppAccess, setAuthorizedUser, getAuthorizedUser } from '../utils/authorized_users';

function adjustTime(dateString: string): string {
  const date = new Date(dateString);
  date.setHours(date.getHours() - 3);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function executeFunction(functionName: string, args: any) {
  console.log(`Executing function: ${functionName} with args:`, args);
  try {
    switch (functionName) {
      case "get_calendar_events":
      case "bitrix_get_calendar_events":
        if (args.rooms) {
          return await getCalendarEventsForRooms(args.rooms, args.from, args.to);
        } else {
          return await getCalendarEvents(args.room, args.from, args.to);
        }
      case "add_lead":
      case "bitrix_add_lead":
        return await addLead(args);
      case "check_and_add_meeting":
      case "bitrix_add_meeting":
        if (args.from && args.to) {
          args.from = adjustTime(args.from);
          args.to = adjustTime(args.to);
        }
        return await checkAndAddMeeting(args);
      case "get_current_datetime":
        return getCurrentDateTime();
      case "get_exchange_rate":
        return await getExchangeRate();
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  } catch (error) {
    console.error(`Error executing function ${functionName}:`, error);
    return { error: error.message };
  }
}

function isValidPhoneNumber(phoneNumber: string): boolean {
  return /^\+?[1-9]\d{9,14}$/.test(phoneNumber);
}

async function simulateSendMessage(to: string, body: string) {
  console.log(`Simulating sending message to ${to}: ${body}`);
  return { sid: 'SIMULATED_MESSAGE_SID' };
}

function splitMessage(message: string, maxLength: number = 1600): string[] {
  const chunks = [];
  let index = 0;
  while (index < message.length) {
    chunks.push(message.slice(index, index + maxLength));
    index += maxLength;
  }
  return chunks;
}

export async function POST(req: Request) {
  console.log('Received WhatsApp message');
  console.log('Environment:', process.env.NODE_ENV);

  const requiredEnvVars = ['OPENAI_API_KEY', 'OPENAI_ASSISTANT_ID', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      return NextResponse.json({ error: `Missing required environment variable: ${envVar}` }, { status: 500 });
    }
  }

  const body = await req.text();
  const params = new URLSearchParams(body);
  const incomingMessage = params.get('Body');
  const from = params.get('From');

  console.log(`Message from ${from}: ${incomingMessage}`);

  let phoneNumber = '';
  if (from) {
    phoneNumber = from.replace('whatsapp:', '');
  } else {
    console.error('From parameter is null');
    return NextResponse.json({ error: "Invalid request: 'From' parameter is missing" }, { status: 400 });
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`Invalid phone number: ${phoneNumber}`);
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const authorizedUser = authorizeWhatsAppAccess(phoneNumber);

  const twilioClient = process.env.NODE_ENV === 'production'
    ? twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
    : { messages: { create: simulateSendMessage } } as any;

  if (!authorizedUser) {
    console.log(`Unauthorized access attempt from ${from}`);
    try {
      const message = await twilioClient.messages.create({
        body: "Acces neautorizat. Vă rugăm să vizionați acest video pentru mai multe informații: https://youtu.be/e3haeOxhV0E?si=LdWhrYJy8q9aAxgg",
        from: 'whatsapp:+15556008949',
        to: from
      });
      console.log('Unauthorized access message sent successfully:', message.sid);
    } catch (err) {
      console.error('Error sending unauthorized access message:', err);
    }
    return NextResponse.json({ message: "Unauthorized access message sent" }, { status: 401 });
  }

  setAuthorizedUser(phoneNumber, authorizedUser);

  try {
    console.log('Creating thread');
    const thread = await openai.beta.threads.create();
    console.log(`Thread created: ${thread.id}`);

    console.log('Adding message to thread');
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: incomingMessage,
    });

    console.log('Running assistant');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
    });

    console.log('Waiting for assistant to complete');
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 30;

    while (runStatus.status !== "completed" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log(`Run status: ${runStatus.status}`);
      attempts++;

      if (runStatus.status === "requires_action") {
        const toolCalls = runStatus.required_action?.submit_tool_outputs.tool_calls;
        if (toolCalls) {
          const toolOutputs = await Promise.all(toolCalls.map(async (toolCall) => {
            const result = await executeFunction(toolCall.function.name, JSON.parse(toolCall.function.arguments));
            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify(result),
            };
          }));

          await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
            tool_outputs: toolOutputs,
          });
        }
      }
    }

    if (attempts >= maxAttempts) {
      console.error("Assistant timed out");
      throw new Error("Asistentul a întâmpinat o problemă. Vă rugăm să încercați din nou.");
    }

    console.log('Retrieving messages');
    const messages = await openai.beta.threads.messages.list(thread.id);

    const assistantResponse = messages.data
      .filter(message => message.role === "assistant")
      .pop()?.content
      .filter(content => content.type === 'text')
      .map(content => (content as any).text.value)
      .join('\n') || "Îmi pare rău, nu am putut genera un răspuns.";

    console.log(`Assistant response: ${assistantResponse}`);

    const personalizedResponse = `${authorizedUser.name.split(' ')[0]}, ${assistantResponse}`;
    const messageChunks = splitMessage(personalizedResponse);

    try {
      for (const chunk of messageChunks) {
        const message = await twilioClient.messages.create({
          body: chunk,
          from: 'whatsapp:+15556008949',
          to: from
        });
        console.log('Response chunk sent back to WhatsApp:', message.sid);
      }
    } catch (err) {
      console.error('Error sending response message:', err);
    }

    return NextResponse.json({ message: "Message processed successfully" });
  } catch (error) {
    console.error('Error:', error);
    try {
      const message = await twilioClient.messages.create({
        body: "Ne cerem scuze, a apărut o eroare în procesarea mesajului dumneavoastră. Vă rugăm să încercați din nou mai târziu.",
        from: 'whatsapp:+15556008949',
        to: from
      });
      console.log('Error message sent successfully:', message.sid);
    } catch (err) {
      console.error('Error sending error message:', err);
    }
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}