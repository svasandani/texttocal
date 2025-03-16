import { DateTime } from "luxon";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import path from "path";
import { fileURLToPath } from "url";

import { Event } from "./types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const llama = await getLlama();
const model = await llama.loadModel({
  modelPath: path.join(__dirname, "..", "models", "hf_mradermacher_Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf")
});
const grammar = await llama.createGrammarForJsonSchema({
  type: "object",
  properties: {
    title: {
      type: "string"
    },
    location: {
      type: "string"
    },
    description: {
      type: "string"
    },
    startDate: {
      type: "string",
      format: "date-time"
    },
    endDate: {
      type: "string",
      format: "date-time"
    },
  }
});

export const parseEventFromText = async (prompt: string): Promise<Event> => {
  console.log({
    msg: "Parsing event from text",
    prompt,
  });

  const context = await model.createContext();

  const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt: "You are a terse, efficient event parsing program." +
    "Always answer as accurately as possible.\n" +
    
    "Titles and locations should be concise and to the point." +
    "Start and end dates should be in ISO 8601 format, in UTC, and should be different from each other." +
    "Today's date is " + DateTime.now().toISO() + ".\n" +
    
    "You will be given unstructured text, potentially extracted from an image." +
    "You should use the text to populate the JSON fields, and nothing else."
  });
  
  const response = await session.prompt(prompt, { grammar });
  const event = grammar.parse(response);

  console.log({
    msg: "Parsed event",
    event,
  });

  session.dispose();

  return event;
};