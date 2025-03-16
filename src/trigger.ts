import { readFileSync, writeFileSync } from "fs";
import PushBullet from "pushbullet";
import Stream from "pushbullet/lib/internal/stream";

export class PushbulletListener {
  private static LATEST_PUSH_FILE = "./tmp/latest_push";
  private pusher: PushBullet;
  private stream: Stream;
  private streamConnected: boolean;
  private latestPush: {
    iden: string;
    modified: number;
  } | undefined;
  private listener: (push: any) => void | undefined;

  constructor(private readonly accessToken: string, private readonly deviceIden: string) {
    this.pusher = new PushBullet(this.accessToken);
    this.stream = this.pusher.stream();
    this.latestPush = this.getLatestPushFromFile();
    console.log({
      msg: "Latest push",
      latestPush: this.latestPush,
    });
  }

  private getLatestPushFromFile() {
    try {
      const latestPush = readFileSync(PushbulletListener.LATEST_PUSH_FILE, "utf8");
      return JSON.parse(latestPush);
    } catch (error) {
      return {
        iden: "",
        modified: Date.now(),
      };
    }
  }

  private writeLatestPushToFile(push: {
    iden: string;
    modified: number;
  }) {
    writeFileSync(PushbulletListener.LATEST_PUSH_FILE, JSON.stringify(push));
  }

  private connectStreamIfNotConnected() {
    if (this.streamConnected) {
      console.log({
        msg: "Stream already connected",
      });
      return;
    } else {
      this.streamConnected = true;
    }

    console.log({
      msg: "Stream not connected, connecting",
    });

    this.stream.connect();

    this.stream.on("nop", () => {
      console.log({
        msg: "Nop from Pushbullet",
      });
    });
    this.stream.on("tickle", (type: string) => {
      if (type === "push") {
        this.handlePushTickle();
      }
    });
    this.stream.on("connect", () => {
      console.log({
        msg: "Stream connected",
      });
      this.streamConnected = true;
    });
    this.stream.on("disconnect", () => {
      console.log({
        msg: "Stream disconnected",
      });
      this.streamConnected = false;
    });
  }

  private async handlePushTickle() {
    console.log({
      msg: "Handling push tickle",
    });
    
    const response = await this.pusher.getList(PushBullet.PUSH_END_POINT, {
      active: true,
      modified_after: 0,
      limit: 10,
    });
    const responseJson = await response.json();

    console.log({
      msg: "Response from Pushbullet",
      responseJson,
    });

    const pushes = responseJson.pushes;

    console.log({
      msg: "Pushes from Pushbullet",
      pushes: pushes.map((push: any) => push.iden),
    });

    const pushesToProcess = this.latestPush
      ? pushes
        .slice(0, pushes.findIndex((push: any) => push.iden === this.latestPush!.iden))
        .slice(0, pushes.findIndex((push: any) => push.modified < this.latestPush!.modified) + 1)
        .filter((push: any) => push.source_device_iden === this.deviceIden)
      : pushes;

    this.latestPush = pushes[0];
    this.writeLatestPushToFile(this.latestPush!);

    /**
     * @todo Multi-thread this
     */
    for (const push of pushesToProcess) {
      this.listener?.(push);
    }
  }

  async registerTickleListener(listener: (push: any) => void) {
    this.connectStreamIfNotConnected();
    this.listener = listener;
  }

  async sendURL(url: string, title: string, body: string) {
    await this.pusher.makeRequest('post', PushBullet.PUSH_END_POINT, { json: {
      type: 'link',
      title,
      url,
      body,
    } })
  }

  async sendNote(title: string, body: string) {
    await this.pusher.makeRequest('post', PushBullet.PUSH_END_POINT, { json: {
      type: 'note',
      title,
      body
    } })
  }

  dispose() {
    this.stream.close();
  }
}