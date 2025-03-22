import PushBullet from "pushbullet";
import Stream from "pushbullet/lib/internal/stream";

export class PushbulletListener {
  private pusher: PushBullet;
  private latestPushModified: number | undefined;
  private stream: Stream;
  private listener: (push: any) => void | undefined;

  constructor(private readonly accessToken: string, private readonly deviceIden: string) {
    this.pusher = new PushBullet(this.accessToken);
    this.stream = this.pusher.stream();
  }

  public async connectStream() {
    return new Promise((resolve, reject) => {
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
      this.stream.on("error", (error) => {
        reject(error)
      })
    });
  }

  private async handlePushTickle() {
    console.log({
      msg: "Handling push tickle",
    });
    
    const response = await this.pusher.getList(PushBullet.PUSH_END_POINT, {
      active: true,
      modified_after: this.latestPushModified ?? 0,
    });
    const responseJson = await response.json();
    const latestInboundPush = responseJson.pushes
      .filter((push: any) => push.source_device_iden === this.deviceIden)[0];
    
    if (!latestInboundPush) {
      console.log({
        msg: "No new inbound push",
      });
      return;
    }

    console.log({
      msg: "Latest inbound push",
      latestInboundPush,
    });

    this.latestPushModified = latestInboundPush.modified;

    this.listener?.(latestInboundPush);
  }

  registerTickleListener(listener: (push: any) => void) {
    this.listener = listener;
  }

  async sendURL(url: string, title: string, body: string) {
    await this.pusher.makeRequest('post', PushBullet.PUSH_END_POINT, { json: {
      type: 'link',
      title,
      url,
      body,
      device_iden: this.deviceIden,
    } })
  }

  async sendNote(title: string, body: string) {
    await this.pusher.makeRequest('post', PushBullet.PUSH_END_POINT, { json: {
      type: 'note',
      title,
      body,
      device_iden: this.deviceIden,
    } })
  }

  dispose() {
    this.stream.close();
  }
}