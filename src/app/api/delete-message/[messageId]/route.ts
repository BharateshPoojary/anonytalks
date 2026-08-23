import { UserModel } from "@/model/User";
import dbConnection from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
/**getServerSession() is a function provided by NextAuth to fetch the session data on the server side in Next.js.
It takes in the authentication options (authOptions), which typically include your configured providers, callbacks, and session settings.
This function returns the session object containing the authenticated user's data, including user information and any custom properties you might have added to the session or JWT */
import { authOptions } from "../../../../lib/options";
import { responseContent } from "@/hooks/use-response";
import mongoose from "mongoose";
export async function DELETE(
  req: Request,
  { params }: { params: { messageId: string } }, //we have to always mention  params in 2nd argument as 1st parameter is request
) {
  //As DELETE request contains messageId in parameter accessing the messageId and specifying the type of messageId . This is custom type we are { params: { messageId: string } } specifying we have to pass like this only params which has messageId of type string.This is the { params } parameter which includes messageId.
  //normally we get request but we destructured it to directly access so directly used params
  const messageId = params.messageId; //accessing messsageId and saving it in a variable
  //   //console.log("Message Id", messageId);
  await dbConnection();
  const accessing_session = await getServerSession(authOptions); //Accessing the session by passing authOptions to it which includes providers , callback etc
  const userObj = accessing_session?.user; //accessing the user object from session
  if (!accessing_session || !userObj) {
    //If the session or user object is not present it means user is not authentiacted
    return responseContent(false, "User is not authenticated", 401);
    // return Response.json(
    //   //returning the response
    //   {
    //     success: false,
    //     message: "User is not authenticated",
    //   },
    //   { status: 401 } //401 means user is not authenticated
    // );
  }
  try {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return responseContent(false, "Invalid message ID", 400);
    }

    const updatedUser = await UserModel.updateOne(
      { _id: userObj._id },
      { $pull: { messages: { _id: new mongoose.Types.ObjectId(messageId) } } },
    ); //updating the user
    // _id: userObj._id, first accessing the user id through session and finding for relevant user
    // $pull: { messages: { _id: messageId } }, The $pull operator removes from an existing array all instances of a value  or values that match a specified condition i.e.entire document specific to messageId if available inside messages[] will be deleted.
    if (updatedUser.modifiedCount == 0) {
      //Its a property from updateOne () method to verify whether the document is updated or not  in DB if >= 1 means one or more doc updated if not ==0 then no document updated
      return responseContent(
        false,
        "Message not found or already deleted",
        404,
      );
      // return Response.json(
      //   //if not updated means message not found
      //   {
      //     success: false,
      //     message: "Message not found or already deleted",
      //   },
      //   { status: 404 } //404 cannot find the requested resource
      // );
    }
    return responseContent(true, "Message deleted successfully", 200);
    // return Response.json(
    //   //if deleted successfully returning the success response
    //   {
    //     success: true,
    //     message: "Message deleted successfully",
    //   },
    //   { status: 200 } //200 request was successful
    // );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return responseContent(
        false,
        `Error deleting user message: ${error.message}`,
        500,
      );
    }
    return responseContent(
      false,
      "Unknown error occurred while deleting user message",
      500,
    );
  }
}
