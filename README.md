# TextToCal

A tool to extract calendar events from images, links, and text notes using ML, then automatically add them to your Google Calendar.

## Overview

TextToCal is a Node.js/TypeScript application that:
1. Listens for Pushbullet notifications containing images, links, or text notes
2. Extracts and processes text content:
   - For images: uses OCR.space to extract text
   - For links: scrapes and parses the webpage
   - For notes: processes the raw text
3. Uses a locally run Llama model to identify event details (title, location, date, time)
4. Adds the event to your Google Calendar
5. Sends a confirmation with event link back to your device

## Prerequisites

- Node.js (v18+) and npm
- A Google Cloud account with Calendar API enabled
- A Pushbullet account and device
- An OCR.space API key
- Sufficient disk space for Llama model (~4GB)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/texttocal.git
   cd texttocal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   
   This will automatically download the Llama model during postinstall.

## Configuration

Create a `.env` file in the project root with the following variables:

```
GOOGLE_APPLICATION_CREDENTIALS=./service_account.json
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
PUSHBULLET_ACCESS_TOKEN=your_pushbullet_token
PUSHBULLET_DEVICE_IDEN=your_device_identifier
OCR_SPACE_API_KEY=your_ocr_space_api_key
```

### Service Account Setup

1. Create a Google Cloud project at [console.cloud.google.com](https://console.cloud.google.com/)
2. Enable the Google Calendar API
3. Create a service account with Calendar access permissions
4. Generate and download a JSON key file
5. Rename the file to `service_account.json` and place it in the project root
6. Share your Google Calendar with the service account email address

### Pushbullet Setup

1. Create an account at [pushbullet.com](https://www.pushbullet.com/)
2. Access your account settings to find your Access Token
3. Install the Pushbullet app on your device(s)
4. Find your device identifier in the Pushbullet API documentation or through the API explorer

### OCR.space Setup

1. Register for an API key at [ocr.space](https://ocr.space/ocrapi)
2. Use the free tier or subscribe for more requests

## Usage

Start the application:

```bash
npm start
```

The application will run and listen for Pushbullet notifications.

### Adding Events

To add an event to your calendar:

1. **Using images**: Send an image containing event details (flyer, screenshot, etc.) via Pushbullet
2. **Using links**: Share a link to an event page via Pushbullet  
3. **Using text**: Send a text note with event details via Pushbullet

The app will process the content, extract event information, and add it to your calendar. You'll receive a notification with the calendar event link once it's created.

## Folder Structure

```
texttocal/
├── src/
│   ├── extract.ts    # Text extraction from sources
│   ├── index.ts      # App entry point
│   ├── load.ts       # Google Calendar integration
│   ├── transform.ts  # Event parsing with Llama
│   ├── trigger.ts    # Pushbullet integration
│   └── types.d.ts    # Type definitions
├── models/           # Llama model files (auto-created)
├── tmp/              # Temporary storage for images
├── .env              # Environment variables
├── package.json      # Project dependencies
└── service_account.json  # Google service account credentials
```

## Troubleshooting

- Ensure all API keys and credentials are correctly set up
- Check the permissions for your Google Calendar service account
- If OCR isn't working correctly, try different image formats or sizes
- For model issues, verify the Llama model was downloaded correctly

## License

This project is licensed under the MIT License - see the LICENSE file for details.
