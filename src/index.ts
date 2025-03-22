import { config } from "dotenv";

import { parseTextFromImage, parseTextFromLink, resizeImageToFilesize, saveImageToFile } from "./extract";
import { writeEventToCalendar } from "./load";
import { enrichEvent, parseEventFromText } from "./transform";
import { PushbulletListener } from "./trigger";

config();

while (true) {
  console.log("Looping...");
  try {
    await new Promise(async (resolve, reject) => {
      console.log("Starting...");

      const pushbullet = new PushbulletListener(process.env.PUSHBULLET_ACCESS_TOKEN ?? "", process.env.PUSHBULLET_DEVICE_IDEN ?? "");
      pushbullet.registerTickleListener(async (push: {
        type: "file";
        file_name: string;
        file_type: string;
        file_url: string;
      } | {
        type: "link";
        title: string;
        url: string;
      } | {
        type: "note";
        body: string;
      }) => {
        console.log({
          msg: "Push received",
          push,
        });
    
        try {
          let text;
          let additionalInfo;
          if (push.type === "file") {
            const path = await saveImageToFile(push.file_url);
            const resizedPath = await resizeImageToFilesize(path);
            text = await parseTextFromImage(resizedPath);
            additionalInfo = push.file_url;
          } else if (push.type === "link") {
            text = push.title + "\n\n" + await parseTextFromLink(push.url);
            additionalInfo = push.url;
          } else if (push.type === "note") {
            text = push.body;
            additionalInfo = push.body;
          }
    
          console.log({
            msg: "Text",
            text,
          });
    
          const event = await parseEventFromText(text);
          const enrichedEvent = await enrichEvent(event, additionalInfo);
          const link = await writeEventToCalendar(enrichedEvent);
    
          console.log({
            msg: "Event written to calendar",
            link,
          });
    
          await pushbullet.sendURL(link, "Event written to calendar", event.title);
        } catch (error) {
          console.error(error);
        }
      });

      process.on("SIGINT", () => {
        pushbullet.dispose();
        process.exit(0);
      });
      process.on("SIGTERM", () => {
        pushbullet.dispose();
        process.exit(0);
      });
      process.on("SIGQUIT", () => {
        pushbullet.dispose();
        process.exit(0);
      });

      try {
        await pushbullet.connectStream();
      } catch (error) {
        process.removeAllListeners();
        pushbullet.dispose();
        reject(error);
      }
    });
  } catch (error) {
    console.error(error)
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
}

