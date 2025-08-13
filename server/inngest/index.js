import { Inngest } from "inngest";
import User from "../models/user";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "pingup-app" });

// Inngest function to save the user data to a database
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user-created" },
  async ({ event }) => {
    // Extract user data from Clerk event
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    // Generate username from email
    let username = email_addresses[0].email_address.split("@")[0];

    // Check if username already exists
    const user = await User.findOne({ username });
    if (user) {
      username += Math.floor(Math.random() * 10000); // Make it unique
    }

    // Create user in your database
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      full_name: `${first_name} ${last_name}`,
      profile_picture: image_url,
      username,
    };
    await User.create(userData);
  }
);

// Inngest function to update user data in database
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const updatedUserData = {
      email: email_addresses[0].email_address,
      full_name: first_name + " " + last_name,
      profile_picture: image_url,
    };

    await User.findByIdAndUpdate(id, updatedUserData);
  }
);

// Inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.delete" },
  async ({ event }) => {
    const { id } = event.data;

    await User.findByIdAndDelete(id);
  }
);

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserUpdation, syncUserDeletion];
