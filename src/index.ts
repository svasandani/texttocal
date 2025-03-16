import { writeEventToCalendar } from "./load";
import { parseEventFromText } from "./transform";
import { parseTextFromImage, parseTextFromLink, resizeImageToFilesize, saveImageToFile } from "./extract";
import { PushbulletListener } from "./trigger";

const pushbullet = new PushbulletListener(process.env.PUSHBULLET_ACCESS_TOKEN ?? "", process.env.PUSHBULLET_DEVICE_IDEN ?? "");
await pushbullet.registerTickleListener(async (push: {
  type: "file";
  file_name: string;
  file_type: string;
  file_url: string;
} | {
  type: "link";
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
    if (push.type === "file") {
      const path = await saveImageToFile(push.file_url);
      const resizedPath = await resizeImageToFilesize(path);
      text = await parseTextFromImage(resizedPath);
    } else if (push.type === "link") {
      text = await parseTextFromLink(push.url);
    } else if (push.type === "note") {
      text = push.body;
    }

    console.log({
      msg: "Text",
      text,
    });

    const event = await parseEventFromText(text);
    const link = await writeEventToCalendar(event);

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
