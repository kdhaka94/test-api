
import twilio from 'twilio';
import { Configuration, OpenAIApi } from 'openai';
import { Maid } from '../models/maid';
import { User } from '../models/user';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
export const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
export async function chatGPT(prompt: string) {
  try {
    const result = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 1024,
    });
    return result;
  } catch (err: any) {
    if (err.response && err.response.data && err.response.data.error) {
      const errorMessage = err.response.data.error.message;
      console.error('Error calling OpenAI API:', errorMessage);
      throw new Error(errorMessage);
    } else {
      console.error('Error calling OpenAI API:', err.message);
      throw err;
    }
  }
}
export async function handleLocationMessage(location: any, from: any, body: any) {
  try {
    if (!location || !location.latitude || !location.longitude) {
      // If the message doesn't contain a location, prompt the user to send their location using ChatGPT
      const prompt = `this is for a whatsapp chatbot now please create a reponse according to user message - "${body}" and our requirement - "ask user for location for checking nearby maids available in their area"`;
      const chatGPTResponse = await chatGPT(prompt);
      console.log(chatGPTResponse.data.choices);
      console.log(chatGPTResponse.data.choices[0].text);
      const reply = chatGPTResponse?.data?.choices?.[0].text?.trim() ?? "Sorry I don't understand, please elaborate";
      await client.messages.create({
        from: 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER,
        to: from,
        body: reply,
      });
    } else {
      // If the message contains a location, find nearby users and maids and send a response message
      const { latitude, longitude } = location;
      const userLocation = { type: 'Point', coordinates: [longitude, latitude] };
      try {
        const users = await User.find({
          location: {
            $near: {
              $geometry: userLocation,
              $maxDistance: 5000, // 5km
            },
          },
        });
        const maids = await Maid.find({
          location: {
            $near: {
              $geometry: userLocation,
              $maxDistance: 5000, // 5km
            },
          },
        });
        const nearbyUsers = users.map(user => user.phoneNumber);
        const nearbyMaids = maids.map(maid => maid.phoneNumber);
        if (nearbyUsers.length > 0 || nearbyMaids.length > 0) {
          const reply = `There are ${nearbyUsers.length} users and ${nearbyMaids.length} maids within a 5km radius:\nUsers: ${nearbyUsers.join(', ')}\nMaids: ${nearbyMaids.join(', ')}`;
          console.log(reply);
          await client.messages.create({
            from: 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER,
            to: from,
            body: reply,
          });
        } else {
          console.log(`No users or maids found within a 5km radius of ${longitude}, ${latitude}`);
          await client.messages.create({
            from: 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER,
            to: from,
            body: 'No users or maids found within a 5km radius of your location.',
          });
        }
        // Save the user's location to the database
        await User.findOneAndUpdate({ phoneNumber: from }, { location: userLocation }, { upsert: true });
      } catch (err: any) {
        console.error('Error querying the database:', err.message);
        throw err;
      }
    }
  } catch (err: any) {
    console.error('Error handling location message:', err.message);
    throw err;
  }
}