import { ObjectId } from "mongodb";

export class MessageAnnotationClient {
  constructor(db) {
    this.collection = db.collection("messageAnnotations");
  }

  insertAnnotation(uid, messageSid) {
    if (!uid || !messageSid) {
      throw new Error("Both uid and messageSid are required to insert an annotation");
    }

    return this.collection.insertOne({ _id: new ObjectId(), sid: messageSid, sender: uid }, { upsert: true });
  }

  getAnnotationByMessageSid(uid, messageSid) {
    if (!messageSid) {
      throw new Error("messageSid is required to fetch an annotation");
    }

    return this.collection.findOne({ sender: uid, sid: messageSid }, { sid: 1, sender: 1 });
  }

  getAnnotationsByMessageSids(uid, messageSids) {
    if (!Array.isArray(messageSids)) {
      throw new Error("An array of messageSids is required to fetch annotations");
    }

    return this.collection.find({ sender: uid, sid: { $in: messageSids } }, { sid: 1, sender: 1 }).toArray();
  }
}
