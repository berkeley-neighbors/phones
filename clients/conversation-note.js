export class ConversationNoteClient {
  constructor(db) {
    this.collection = db.collection("conversationNotes");
  }

  async getNote(uid, phoneNumber) {
    if (!uid || !phoneNumber) {
      throw new Error("Both uid and phoneNumber are required");
    }

    return this.collection.findOne({ uid, phoneNumber });
  }

  async getNotesByPhoneNumbers(uid, phoneNumbers) {
    if (!Array.isArray(phoneNumbers)) {
      throw new Error("An array of phoneNumbers is required");
    }

    return this.collection.find({ uid, phoneNumber: { $in: phoneNumbers } }).toArray();
  }

  async upsertNote(uid, phoneNumber, { notes, done }) {
    if (!uid || !phoneNumber) {
      throw new Error("Both uid and phoneNumber are required");
    }

    const update = {};
    if (notes !== undefined) update.notes = notes;
    if (done !== undefined) update.done = done;

    return this.collection.updateOne(
      { uid, phoneNumber },
      { $set: { ...update, updatedAt: new Date() } },
      { upsert: true },
    );
  }
}
