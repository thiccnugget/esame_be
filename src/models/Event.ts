import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organization: { type: String, required: true },
  venue: { type: String, required: true },
  date:{ type: String, required: true},
  tickets:{type: [{"name": String, "price": Number, "quantity": Number}], required:true}
});

export const Event = mongoose.model("Event", EventSchema);
