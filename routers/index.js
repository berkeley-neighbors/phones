// Each router can be thought of as its own mini-express application so
// it is more than appropriate to accept few arguments and read from
// environment variables as needed.
export { Router as StaffRouter } from "./staff.js";
export { Router as PhonebookRouter } from "./phonebook.js";
export { Router as MessageRouter } from "./message.js";
