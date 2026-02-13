import { ObjectId } from "mongodb";

export class ScheduleClient {
  constructor(db) {
    this.scheduleCollection = db.collection("schedules");
    this.profileCollection = db.collection("schedule_profiles");
    this.staffCollection = db.collection("staff");
  }

  async getProfile(uid) {
    return this.profileCollection.findOne({ uid });
  }

  async setProfile(uid, phoneNumber) {
    const staff = await this.staffCollection.findOne({ phone_number: phoneNumber });

    if (!staff) {
      throw new Error("Phone number not found in staff directory");
    }

    return this.profileCollection.updateOne(
      { uid },
      {
        $set: {
          uid,
          phone_number: phoneNumber,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async deleteProfile(uid) {
    await this.scheduleCollection.deleteMany({ uid });
    return this.profileCollection.deleteOne({ uid });
  }

  async getAllSchedules() {
    return this.scheduleCollection.find({}).toArray();
  }

  async createSchedule(uid, data) {
    const profile = await this.getProfile(uid);

    if (!profile) {
      throw new Error("Please link your phone number first");
    }

    const isAlways = data.always || false;

    if (!isAlways) {
      if (!data.start_time || !data.end_time || !data.date) {
        throw new Error("start_time, end_time, and date are required");
      }

      if (data.start_time >= data.end_time) {
        throw new Error("End time must be after start time");
      }
    }

    if (isAlways) {
      const existing = await this.scheduleCollection.findOne({
        uid,
        always: true,
      });

      if (existing) {
        throw new Error("Already marked as always on-call");
      }
    }

    const schedule = {
      _id: new ObjectId(),
      uid,
      phone_number: profile.phone_number,
      start_time: isAlways ? "00:00" : data.start_time,
      end_time: isAlways ? "23:59" : data.end_time,
      day_of_week: data.day_of_week ?? null,
      recurring: false,
      always: isAlways,
      date: data.date || new Date().toISOString().split("T")[0],
      created_at: new Date(),
    };

    await this.scheduleCollection.insertOne(schedule);
    return schedule;
  }

  async updateSchedule(uid, id, data) {
    const schedule = await this.scheduleCollection.findOne({ _id: new ObjectId(id) });

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    if (schedule.uid !== uid) {
      throw new Error("Unauthorized: Cannot modify another user's schedule");
    }

    const update = {};
    if (data.start_time !== undefined) update.start_time = data.start_time;
    if (data.end_time !== undefined) update.end_time = data.end_time;
    if (data.recurring !== undefined) update.recurring = data.recurring;
    if (data.day_of_week !== undefined) update.day_of_week = data.day_of_week;
    if (data.date !== undefined) update.date = data.date;

    return this.scheduleCollection.updateOne({ _id: new ObjectId(id) }, { $set: update });
  }

  async deleteSchedule(uid, id) {
    const schedule = await this.scheduleCollection.findOne({ _id: new ObjectId(id) });

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    if (schedule.uid !== uid) {
      throw new Error("Unauthorized: Cannot delete another user's schedule");
    }

    return this.scheduleCollection.deleteOne({ _id: new ObjectId(id) });
  }

  async deleteByPhoneNumber(phoneNumber) {
    await this.scheduleCollection.deleteMany({ phone_number: phoneNumber });
    await this.profileCollection.deleteMany({ phone_number: phoneNumber });
  }
}
