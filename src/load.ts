import { google } from "googleapis";
import { DateTime } from "luxon";
import process from "process";

import { Event } from "./types";

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const getDate = (date: string, addHours = 0) => {
  return DateTime.fromISO(date.split("Z")[0].split("+")[0], { zone: "America/New_York" }).plus({ hours: addHours }).toISO({
    suppressMilliseconds: true,
  });
}

export const writeEventToCalendar = async (event: Event) => {
  console.log({
    msg: "Writing event to calendar",
    event,
    auth: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });

  const promise = new Promise<string>((resolve, reject) => {
    google.calendar("v3").events.insert(
      {
        auth,
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        requestBody: {
          summary: event.title,
          location: event.location,
          description: event.description,
          start: {
            dateTime: getDate(event.startDate),
          },
          end: {
            dateTime: event.startDate === event.endDate ? getDate(event.startDate, 1) : getDate(event.endDate),
          },
        },
      },
      function (err, response) {
        if (err || !response?.data) {
          console.error({
            msg: "Error connecting to Calendar API",
            err,
          });

          reject(err);
        }

        console.log({
          msg: "Event written to calendar",
          response,
        })
        
        resolve(response?.data?.htmlLink ?? "");
      }
    );
  });

  const link = await promise;

  console.log({
    msg: "Link to event",
    link,
  })

  return link;
}